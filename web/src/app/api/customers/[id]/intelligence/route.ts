import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const customer = await prisma.customer.findUnique({
            where: { id, companyId },
            include: {
                invoices: {
                    where: { status: { not: 'CANCELLED' } },
                    select: {
                        totalAmountHt: true,
                        totalAmountTtc: true,
                        amountRemaining: true,
                        dueDate: true,
                        status: true
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // 1. ABC Segment Rank
        const allCustomerRevenues = await prisma.customer.findMany({
            where: { companyId },
            select: { id: true, totalRevenue: true }
        });

        allCustomerRevenues.sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0));
        
        const customerIdx = allCustomerRevenues.findIndex(c => c.id === id);
        const totalCustomersCount = allCustomerRevenues.length || 1;
        const percentile = (customerIdx + 1) / totalCustomersCount;

        let segment: 'A' | 'B' | 'C' = 'C';
        if (percentile <= 0.20 || customerIdx === 0) {
            segment = 'A';
        } else if (percentile <= 0.50) {
            segment = 'B';
        }

        // 2. Overdue Balance & DSO
        const dso = customer.avgPaymentDelay || 0;
        const now = new Date();
        const overdueInvoices = customer.invoices.filter(inv => 
            ['SENT', 'PARTIAL', 'UNPAID'].includes(inv.status) && 
            inv.dueDate && new Date(inv.dueDate) < now
        );
        const overdueBalance = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amountRemaining || 0), 0);

        // 3. Risk Level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (dso > 60 || overdueBalance > 100000) {
            riskLevel = 'HIGH';
        } else if (dso > 45 || overdueBalance > 0) {
            riskLevel = 'MEDIUM';
        }

        // 4. Health Score
        let healthScore = 100;
        
        // Deduction for unpaid ratio
        const totalInvoicesCount = customer.invoices.length;
        const unpaidInvoicesCount = customer.invoices.filter(inv => ['SENT', 'PARTIAL', 'UNPAID'].includes(inv.status)).length;
        const unpaidRatio = totalInvoicesCount > 0 ? unpaidInvoicesCount / totalInvoicesCount : 0;
        healthScore -= Math.round(unpaidRatio * 40);

        // Deduction for DSO
        if (dso > 30) {
            healthScore -= Math.min(30, Math.round((dso - 30) * 0.5));
        }

        // Deduction for credit limit exceeded
        const totalOutstanding = customer.invoices.reduce((sum, inv) => sum + Number(inv.amountRemaining || 0), 0);
        if (totalOutstanding > Number(customer.creditLimit || 0)) {
            healthScore -= 20;
        }

        healthScore = Math.max(10, Math.min(100, healthScore));

        // 5. Top Products Purchased
        const salesLines = await prisma.salesOrderLine.findMany({
            where: {
                salesOrder: {
                    customerId: id,
                    companyId,
                    status: { not: 'CANCELLED' }
                }
            },
            include: {
                product: true
            }
        });

        const productMap = new Map<string, { id: string, name: string, quantity: number, revenue: number }>();
        for (const line of salesLines) {
            const p = line.product;
            if (!p) continue;
            const qty = Number(line.quantity || 0);
            const rev = Number(line.lineTotalHt || 0);
            if (productMap.has(p.id)) {
                const existing = productMap.get(p.id)!;
                existing.quantity += qty;
                existing.revenue += rev;
            } else {
                productMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    quantity: qty,
                    revenue: rev
                });
            }
        }
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 6. Recent Interactions
        const dbInteractions = await prisma.customerInteraction.findMany({
            where: { customerId: id, companyId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        let recentInteractions = dbInteractions.map(ci => ({
            id: ci.id,
            type: ci.type,
            direction: ci.direction,
            subject: ci.subject,
            content: ci.content,
            createdAt: ci.createdAt
        }));

        if (recentInteractions.length === 0) {
            const activityLogs = await prisma.activityLog.findMany({
                where: { customerId: id, module: 'Customer' },
                orderBy: { createdAt: 'desc' },
                take: 5
            });
            recentInteractions = activityLogs.map(log => {
                const details = (log.details as any) || {};
                return {
                    id: log.id,
                    type: log.action,
                    direction: details.direction || 'OUTBOUND',
                    subject: details.subject || log.action,
                    content: details.content || '',
                    createdAt: log.createdAt
                };
            });
        }

        // 7. Sentiment
        let sentiment = 'NEUTRE';
        if (healthScore > 75) {
            sentiment = 'POSITIF';
        } else if (healthScore < 40) {
            sentiment = 'NÉGATIF';
        }

        // 8. AI Summary Text
        const formattedRevenue = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(customer.totalRevenue || 0)).replace(/[\u202f\u00a0\s]/g, '\u00a0') + ' DA';
        const summary = `Client classifié dans le segment ${segment} (percentile de chiffre d'affaires: ${(percentile * 100).toFixed(0)}%). Son chiffre d'affaires cumulé s'élève à ${formattedRevenue} avec un délai moyen de règlement (DSO) de ${dso} jours. Le niveau de risque est évalué comme ${riskLevel} et la santé globale est de ${healthScore}/100. ${dbInteractions.length} interactions directes ont été enregistrées avec ce client.`;

        const intelligence = {
            healthScore,
            riskLevel,
            segment,
            summary,
            recentInteractions,
            topProducts,
            sentiment
        };

        return NextResponse.json(intelligence);
    } catch (error) {
        console.error('Intelligence Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
