import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

// POST /api/sales/orders/[id]/cancel — cancel + restore reserved stock
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
    if (['INVOICED', 'CANCELLED'].includes(order.status)) {
      return new NextResponse('Cannot cancel an invoiced or already cancelled order', { status: 400 });
    }

    const wasValidated = ['VALIDATED', 'PREPARING'].includes(order.status);

    const updated = await prisma.$transaction(async (tx) => {
      if (wasValidated) {
        // Restore reserved stock
        for (const line of order.lines) {
          if (line.product.trackStock) {
            await tx.product.update({
              where: { id: line.productId },
              data: { stockReserved: { decrement: Number(line.quantity) } }
            });
          }
        }
      }

      return tx.salesOrder.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true } },
          lines: { include: { product: { select: { id: true, name: true } } } }
        }
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[SALES_ORDER_CANCEL]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
