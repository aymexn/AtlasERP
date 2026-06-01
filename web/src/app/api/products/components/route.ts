import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const excludeId = searchParams.get('excludeId') || '';

        const where: any = {
            companyId,
            isActive: true,
            OR: [
                { articleType: { in: ['RAW_MATERIAL', 'SEMI_FINISHED'] } },
                { type: { in: ['RAW_MATERIAL', 'SEMI_FINISHED'] } }
            ]
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                sku: true,
                standardCost: true,
                purchasePriceHt: true,
                unit: true
            },
            orderBy: {
                name: 'asc'
            },
            take: 50
        });

        // Map standardCost/purchasePriceHt to costPrice, and unit to the response
        const mapped = products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            costPrice: Number(p.standardCost || p.purchasePriceHt || 0),
            unit: p.unit
        }));

        return NextResponse.json(mapped);
    } catch (error: any) {
        console.error('Failed to fetch components:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
