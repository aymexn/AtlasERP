import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        // 1. Fetch products for Top 10 by value
        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true
            },
            select: {
                name: true,
                sku: true,
                stockQuantity: true,
                standardCost: true,
                articleType: true,
                family: {
                    select: {
                        name: true,
                        colorBadge: true
                    }
                }
            }
        });

        // Compute values and map
        const mappedProducts = products.map(p => {
            const qty = Number(p.stockQuantity || 0);
            const cost = Number(p.standardCost || 0);
            const value = qty * cost;
            
            // Map types for presentation: MP = Matière première, SF = Semi-fini, PF = Produit fini
            let typeAbbr = 'PF';
            if (p.articleType === 'RAW_MATERIAL') typeAbbr = 'MP';
            else if (p.articleType === 'SEMI_FINISHED') typeAbbr = 'SF';

            return {
                name: p.name,
                sku: p.sku,
                valeur_stock: Math.round(value),
                type: typeAbbr
            };
        });

        // Sort desc and take top 10
        const topProducts = mappedProducts
            .filter(p => p.valeur_stock > 0)
            .sort((a, b) => b.valeur_stock - a.valeur_stock)
            .slice(0, 10);

        // 2. Fetch and aggregate family values
        const families = await prisma.productFamily.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                colorBadge: true,
                products: {
                    where: { isActive: true },
                    select: {
                        stockQuantity: true,
                        standardCost: true
                    }
                }
            }
        });

        const familyDistribution = families.map(f => {
            const totalVal = f.products.reduce((sum, p) => {
                const qty = Number(p.stockQuantity || 0);
                const cost = Number(p.standardCost || 0);
                return sum + (qty * cost);
            }, 0);

            return {
                name: f.name,
                color_badge: f.colorBadge || 'blue',
                valeur: Math.round(totalVal)
            };
        }).filter(f => f.valeur > 0);

        return NextResponse.json({
            topProducts,
            familyDistribution
        });
    } catch (error: any) {
        console.error('Failed to get top products / families:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
