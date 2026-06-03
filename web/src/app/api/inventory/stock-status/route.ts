import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all'; // 'all', 'low_stock', 'out_of_stock'
        const familyId = searchParams.get('familyId') || undefined;

        // Fetch products
        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                ...(familyId && familyId !== 'all' && { familyId }),
            },
            include: {
                family: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Map and calculate
        const mapped = products.map((p: any) => {
            const qty = Number(p.stockQuantity || 0);
            const reorder = Number(p.reorderPoint || 0);
            const cost = Number(p.purchasePriceHt || p.standardCost || 0);
            const value = qty * cost;

            let status: 'OK' | 'LOW' | 'OUT' = 'OK';
            if (qty <= 0) {
                status = 'OUT';
            } else if (reorder > 0 && qty <= reorder) {
                status = 'LOW';
            }

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                family: p.family ? { id: p.family.id, name: p.family.name } : null,
                unit: p.unit || 'PCS',
                stockQuantity: qty,
                reorderPoint: reorder,
                costPrice: cost,
                stockValue: cost > 0 ? value : 0,
                status
            };
        });

        // Apply Status Filters
        let filtered = mapped;
        if (filter === 'low_stock') {
            filtered = mapped.filter(p => p.status === 'LOW');
        } else if (filter === 'out_of_stock') {
            filtered = mapped.filter(p => p.status === 'OUT');
        }

        // Calculate total stock value for items with cost > 0
        const totalStockValue = filtered.reduce((sum, p) => {
            return sum + (p.costPrice > 0 ? p.stockValue : 0);
        }, 0);

        return NextResponse.json({
            data: filtered,
            totalStockValue
        });

    } catch (error: any) {
        console.error('Failed to get stock status:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
