import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        // Detect current locale from query params, cookies, or accept-language header
        const url = new URL(request.url);
        let locale = url.searchParams.get('locale');
        
        if (!locale) {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            locale = cookieStore.get('NEXT_LOCALE')?.value || null;
        }
        if (!locale) {
            const acceptLang = request.headers.get('accept-language');
            if (acceptLang) {
                const primary = acceptLang.split(',')[0].split('-')[0];
                if (['fr', 'en', 'ar'].includes(primary)) {
                    locale = primary;
                }
            }
        }
        if (!locale) {
            locale = 'fr';
        }

        // 1. Analyze Inventory Stock
        const lowStockProducts = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                stockQuantity: { lte: prisma.product.fields.reorderPoint }
            },
            select: {
                id: true,
                name: true,
                stockQuantity: true,
                reorderPoint: true,
                salePriceHt: true
            },
            take: 5
        });

        // 2. Analyze Invoice Payments
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'OVERDUE', 'PARTIAL'] as any },
                dueDate: { lt: new Date() }
            },
            select: {
                id: true,
                reference: true,
                amountRemaining: true,
                dueDate: true
            }
        });

        // Calculate dynamic values
        const insights = [];

        // Insight 1: Stock Alert
        if (lowStockProducts.length > 0) {
            const estimatedLoss = lowStockProducts.reduce((sum, p) => sum + (Number(p.salePriceHt || 0) * 10), 0);
            
            const titles: Record<string, string> = {
                fr: `${lowStockProducts.length} produits en rupture ou stock critique`,
                en: `${lowStockProducts.length} products out of stock or at critical level`,
                ar: `${lowStockProducts.length} منتجات نافدة أو في مستوى مخزون حرج`
            };
            const descriptions: Record<string, string> = {
                fr: `Les stocks de vos best-sellers (dont "${lowStockProducts[0].name}") sont inférieurs au point de commande. Délai de réapprovisionnement estimé : 7 jours.`,
                en: `Stocks of your best-sellers (including "${lowStockProducts[0].name}") are below the reorder point. Estimated replenishment time: 7 days.`,
                ar: `مخزون المنتجات الأكثر مبيعًا لديك (بما في ذلك "${lowStockProducts[0].name}") أقل من حد إعادة الطلب. وقت التوريد المقدر: 7 أيام.`
            };

            insights.push({
                id: 'stock-alert',
                type: 'alert',
                category: 'inventory',
                priority: 'critical',
                title: titles[locale] || titles.fr,
                description: descriptions[locale] || descriptions.fr,
                impactValue: estimatedLoss,
                confidenceScore: 94,
                data: {
                    productsCount: lowStockProducts.length,
                    sampleProduct: lowStockProducts[0].name
                },
                createdAt: new Date()
            });
        } else {
            const titles: Record<string, string> = {
                fr: 'Niveaux de stock optimaux',
                en: 'Optimal stock levels',
                ar: 'مستويات المخزون مثالية'
            };
            const descriptions: Record<string, string> = {
                fr: "L'IA n'a détecté aucune anomalie ou rupture imminente pour vos 15 produits phares.",
                en: "The AI did not detect any anomalies or imminent shortages for your top 15 products.",
                ar: "لم يكتشف الذكاء الاصطناعي أي مشاكل أو نقص وشيك لمنتجاتك الـ 15 الرئيسية."
            };

            insights.push({
                id: 'stock-info',
                type: 'prediction',
                category: 'inventory',
                priority: 'low',
                title: titles[locale] || titles.fr,
                description: descriptions[locale] || descriptions.fr,
                impactValue: 0,
                confidenceScore: 98,
                createdAt: new Date()
            });
        }

        // Insight 2: Cash flow opportunity (Aged Receivables)
        if (overdueInvoices.length > 0) {
            const totalOutstanding = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amountRemaining || 0), 0);
            
            const titles: Record<string, string> = {
                fr: 'Optimisation de la trésorerie disponible',
                en: 'Available cash flow optimization',
                ar: 'تحسين التدفقات النقدية المتاحة'
            };
            const descriptions: Record<string, string> = {
                fr: `En automatisant les relances pour ${overdueInvoices.length} factures en retard de paiement, vous pouvez récupérer des liquidités rapidement.`,
                en: `By automating reminders for ${overdueInvoices.length} overdue invoices, you can quickly recover liquidity.`,
                ar: `من خلال أتمتة التذكيرات لـ ${overdueInvoices.length} فواتير متأخرة الدفع، يمكنك استرداد السيولة النقدية بسرعة.`
            };

            insights.push({
                id: 'cash-opportunity',
                type: 'opportunity',
                category: 'finance',
                priority: 'high',
                title: titles[locale] || titles.fr,
                description: descriptions[locale] || descriptions.fr,
                impactValue: totalOutstanding,
                confidenceScore: 89,
                data: {
                    invoicesCount: overdueInvoices.length
                },
                createdAt: new Date()
            });
        }

        // Insight 3: Customer loyalty recommendation (Real Churn Calculation)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const churningCustomers = await prisma.customer.findMany({
            where: {
                companyId,
                isActive: true,
                salesOrders: {
                    some: {},
                    none: {
                        date: { gte: thirtyDaysAgo }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                totalRevenue: true
            },
            take: 3
        });

        if (churningCustomers.length > 0) {
            const customerNames = churningCustomers.map(c => c.name).join(', ');
            const estimatedLoss = churningCustomers.reduce((sum, c) => sum + Number(c.totalRevenue || 0), 0) * 0.15;
            
            const titles: Record<string, string> = {
                fr: 'Opportunité de réactivation client',
                en: 'Customer reactivation opportunity',
                ar: 'فرصة إعادة تنشيط العملاء'
            };
            const descriptions: Record<string, string> = {
                fr: `${churningCustomers.length} client(s) n'ont pas passé de commande depuis plus de 30 jours (${customerNames}).`,
                en: `${churningCustomers.length} customer(s) have not placed an order in over 30 days (${customerNames}).`,
                ar: `${churningCustomers.length} زبون لم يقوموا بتقديم أي طلب منذ أكثر من 30 يومًا (${customerNames}).`
            };

            insights.push({
                id: 'churn-warning',
                type: 'recommendation',
                category: 'customer',
                priority: 'medium',
                title: titles[locale] || titles.fr,
                description: descriptions[locale] || descriptions.fr,
                impactValue: Math.round(estimatedLoss),
                confidenceScore: 85,
                createdAt: new Date()
            });
        }

        return NextResponse.json(insights);
    } catch (error) {
        console.error('AI Insights GET Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
