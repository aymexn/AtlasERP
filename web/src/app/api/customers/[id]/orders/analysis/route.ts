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
                salesOrders: {
                    orderBy: { date: 'desc' },
                    select: {
                        id: true,
                        reference: true,
                        date: true,
                        status: true,
                        totalAmountTtc: true
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const orders = customer.salesOrders || [];
        const openOrders = orders.filter(o => !['SHIPPED', 'INVOICED', 'CANCELLED'].includes(o.status));
        const totalOpenOrders = openOrders.length;
        const valueOpenOrders = openOrders.reduce((sum, o) => sum + Number(o.totalAmountTtc), 0);

        const completedOrders = orders.filter(o => o.status === 'SHIPPED' || o.status === 'INVOICED');
        const totalCompleted = completedOrders.length;
        const totalValueCompleted = completedOrders.reduce((sum, o) => sum + Number(o.totalAmountTtc), 0);
        
        const aov = totalCompleted > 0 ? totalValueCompleted / totalCompleted : 0;

        // Group by month for chart
        const monthlyStats: Record<string, number> = {};
        orders.forEach(o => {
            const date = new Date(o.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyStats[monthYear] = (monthlyStats[monthYear] || 0) + Number(o.totalAmountTtc);
        });

        const trend = Object.entries(monthlyStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12) // Last 12 months
            .map(([label, revenue]) => ({ label, revenue }));

        const ordersAnalysis = {
            totalOrders: orders.length,
            totalOpenOrders,
            valueOpenOrders,
            aov,
            lifetimeValue: totalValueCompleted,
            recentOrders: orders.slice(0, 5),
            trend
        };

        return NextResponse.json(ordersAnalysis);
    } catch (error) {
        console.error('Orders Analysis Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
