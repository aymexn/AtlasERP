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
        const sku = searchParams.get('sku');
        const excludeId = searchParams.get('excludeId');

        if (!sku) {
            return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
        }

        const where: any = {
            sku: sku.trim(),
            companyId: companyId
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const count = await prisma.product.count({ where });

        return NextResponse.json({ exists: count > 0 });
    } catch (error: any) {
        console.error('Failed to check SKU:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
