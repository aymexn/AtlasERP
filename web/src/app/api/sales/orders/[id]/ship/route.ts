import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

// POST /api/sales/orders/[id]/ship — mark shipped + decrement stock
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
    if (!['VALIDATED', 'PREPARING', 'DRAFT', 'CONFIRMED'].includes(order.status)) {
      return new NextResponse(`Cannot ship order with status ${order.status}`, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        if (line.product.trackStock) {
          // Decrement actual stock
          await tx.product.update({
            where: { id: line.productId },
            data: {
              stockQuantity: { decrement: Number(line.quantity) },
              // If it was validated, also release the reservation
              ...(order.status === 'VALIDATED' || order.status === 'PREPARING'
                ? { stockReserved: { decrement: Number(line.quantity) } }
                : {}),
            }
          });

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              companyId,
              productId: line.productId,
              type: 'OUT',
              movementType: 'OUT',
              quantity: Number(line.quantity),
              date: new Date(),
              reference: order.reference,
              salesOrderId: order.id,
              unit: line.product.unit || 'pcs',
              unitCost: Number(line.product.standardCost || 0),
              totalCost: Number(line.product.standardCost || 0) * Number(line.quantity),
            }
          });
        }
      }

      return tx.salesOrder.update({
        where: { id },
        data: {
          status: 'SHIPPED',
          shippedAt: new Date(),
          lines: {
            updateMany: {
              where: { salesOrderId: id },
              data: {} // shippedQuantity update would go here in future
            }
          }
        },
        include: {
          customer: { select: { id: true, name: true } },
          lines: { include: { product: { select: { id: true, name: true, sku: true } } } }
        }
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[SALES_ORDER_SHIP]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
