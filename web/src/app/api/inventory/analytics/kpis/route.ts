import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const now = new Date();
        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // 1. Fetch active products
        const products = await prisma.product.findMany({
            where: { companyId, isActive: true },
            select: {
                id: true,
                stockQuantity: true,
                standardCost: true,
                reorderPoint: true,
                trackStock: true,
                createdAt: true,
                stockMovements: {
                    take: 1,
                    orderBy: { date: 'desc' },
                    select: { date: true }
                }
            }
        });

        let totalValue = 0;
        let alertCount = 0;
        let stockOutCount = 0;
        let deadStockCount = 0;
        let deadStockValue = 0;
        const totalProducts = products.length;

        for (const p of products) {
            const qty = Number(p.stockQuantity || 0);
            const cost = Number(p.standardCost || 0);
            totalValue += qty * cost;

            if (qty <= 0) {
                stockOutCount++;
            }

            if (p.trackStock && qty <= Number(p.reorderPoint || 0)) {
                alertCount++;
            }

            const lastMovementDate = p.stockMovements[0]?.date || p.createdAt;
            if (lastMovementDate < ninetyDaysAgo && qty > 0) {
                deadStockCount++;
                deadStockValue += qty * cost;
            }
        }

        const stockOutRate = totalProducts > 0 ? (stockOutCount / totalProducts) * 100 : 0;

        // 2. Fetch movements for COGS and Average Stock calculations
        const allMovements = await prisma.stockMovement.findMany({
            where: {
                companyId,
                date: { gte: sevenMonthsAgo }
            },
            select: {
                type: true,
                quantity: true,
                totalCost: true,
                date: true
            },
            orderBy: { date: 'asc' }
        });

        // Calculate COGS in last 7 months
        const cogs7Months = allMovements
            .filter(m => m.type === 'OUT')
            .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

        // Calculate Sales in last 30 days
        const sales30Days = allMovements
            .filter(m => m.type === 'OUT' && m.date >= thirtyDaysAgo)
            .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

        // Reconstruct average stock value over the last 7 months
        // We define the end dates of each of the last 7 months
        const monthEndDates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(1); // avoid month overflow issues
            d.setMonth(d.getMonth() - i);
            // set to end of that month
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            monthEndDates.push(endOfMonth);
        }

        let stockMoyenSum = 0;
        for (const endDate of monthEndDates) {
            // Reconstruct total stock at endDate
            // We start from current stock quantity, and reverse movements that occurred after endDate
            let reconstructedValue = totalValue;
            for (const m of allMovements) {
                if (m.date > endDate) {
                    const movementValue = Number(m.totalCost || 0);
                    if (m.type === 'IN') {
                        reconstructedValue -= movementValue;
                    } else if (m.type === 'OUT') {
                        reconstructedValue += movementValue;
                    }
                }
            }
            stockMoyenSum += Math.max(0, reconstructedValue);
        }

        const stockMoyen7Months = stockMoyenSum / 7;
        const stockTurnover = stockMoyen7Months > 0 ? (cogs7Months / stockMoyen7Months) * (12 / 7) : 0;
        const daysOfStock = sales30Days > 0 ? (totalValue / sales30Days) * 30 : 365;

        return NextResponse.json({
            totalValue,
            stockTurnover: parseFloat(stockTurnover.toFixed(1)),
            daysOfStock: Math.round(daysOfStock),
            alertCount,
            stockOutRate: parseFloat(stockOutRate.toFixed(1)),
            deadStockCount,
            deadStockValue
        });
    } catch (error: any) {
        console.error('Failed to calculate stock KPIs:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
