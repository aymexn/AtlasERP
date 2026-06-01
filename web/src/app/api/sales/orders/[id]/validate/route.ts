import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

// POST /api/sales/orders/[id]/validate — validate + reserve stock
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const order = await prisma.salesOrder.findUnique({
      where: { id, companyId },
      include: { lines: { include: { product: true } } }
    });
    if (!order) return new NextResponse('Not found', { status: 404 });
    if (order.status !== 'DRAFT' && order.status !== 'CONFIRMED') {
      return new NextResponse('Can only validate DRAFT or CONFIRMED orders', { status: 400 });
    }

    // Verify stock availability
    for (const line of order.lines) {
      const available = Number(line.product.stockQuantity) - Number(line.product.stockReserved);
      if (line.product.trackStock && available < Number(line.quantity)) {
        return NextResponse.json({
          error: `Stock insuffisant pour ${line.product.name}. Disponible: ${available}, Commandé: ${Number(line.quantity)}`
        }, { status: 400 });
      }
    }

    // Use transaction to atomically validate + reserve
    const updated = await prisma.$transaction(async (tx) => {
      // Reserve stock for each line
      for (const line of order.lines) {
        if (line.product.trackStock) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stockReserved: { increment: Number(line.quantity) } }
          });
        }
      }

      return tx.salesOrder.update({
        where: { id },
        data: {
          status: 'VALIDATED',
          validatedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true } },
          lines: { include: { product: { select: { id: true, name: true, sku: true, stockQuantity: true, stockReserved: true } } } }
        }
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[SALES_ORDER_VALIDATE]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
