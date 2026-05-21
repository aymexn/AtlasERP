import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        reorderPoint: true,
        unit: true
      },
      orderBy: { stockQuantity: 'asc' }
    });

    const alerts = products.filter(p => Number(p.stockQuantity) < Number(p.reorderPoint));

    return NextResponse.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('[INVENTORY_ALERTS_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
