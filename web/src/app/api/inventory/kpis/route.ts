import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        // Fetch all active products
        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
            },
            select: {
                stockQuantity: true,
                reorderPoint: true,
                standardCost: true,
                purchasePriceHt: true,
                trackStock: true,
            }
        });

        // Compute KPIs
        let totalStockValue = 0;
        let trackedProducts = 0;
        let alertCount = 0;
        let outOfStockCount = 0;

        for (const p of products) {
            const qty = Number(p.stockQuantity || 0);
            const cost = Number(p.purchasePriceHt || p.standardCost || 0);
            const reorder = Number(p.reorderPoint || 0);

            // Total stock value is SUM(stockQuantity * cost) for all active products
            if (cost > 0) {
                totalStockValue += qty * cost;
            }

            if (p.trackStock) {
                trackedProducts++;
                if (qty <= 0) {
                    outOfStockCount++;
                }
                
                const hasAlert = (qty <= reorder && reorder > 0) || qty <= 0;
                if (hasAlert) {
                    alertCount++;
                }
            }
        }

        return NextResponse.json({
            totalStockValue,
            trackedProducts,
            alertCount,
            outOfStockCount
        });

    } catch (error: any) {
        console.error('Failed to get inventory KPIs:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
