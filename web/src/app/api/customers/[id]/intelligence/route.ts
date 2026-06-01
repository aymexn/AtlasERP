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
            select: {
                riskLevel: true,
                segment: true,
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        action: true,
                        details: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const healthScore = 85;
        const riskLevel = customer.riskLevel || 'LOW';
        const segment = customer.segment || 'C';

        const intelligence = {
            healthScore,
            riskLevel,
            segment,
            summary: `Ce client appartient au segment ${segment}. Son niveau de risque est ${riskLevel}.`,
            recentInteractions: customer.activityLogs.map((log: any) => {
                const details = log.details || {};
                return {
                    type: log.action,
                    direction: details.direction || 'OUTBOUND',
                    subject: details.subject || log.action,
                    content: details.content || (typeof details === 'string' ? details : 'Pas de détails'),
                    createdAt: log.createdAt
                };
            }),
            topProducts: [
                { id: '1', name: 'Produit A', quantity: 150, revenue: 15000 },
                { id: '2', name: 'Produit B', quantity: 80, revenue: 8000 }
            ],
            sentiment: 'POSITIF'
        };

        return NextResponse.json(intelligence);
    } catch (error) {
        console.error('Intelligence Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
