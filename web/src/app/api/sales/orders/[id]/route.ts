import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

// GET /api/sales/orders/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const order = await prisma.salesOrder.findUnique({
      where: { id, companyId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
        lines: {
          include: {
            product: {
              select: {
                id: true, name: true, sku: true,
                standardCost: true, stockQuantity: true, stockReserved: true, salePriceHt: true
              }
            }
          }
        },
        invoice: { select: { id: true, reference: true, status: true } },
        stockMovements: { select: { id: true, quantity: true, type: true, date: true } }
      }
    });

    if (!order) return new NextResponse('Not found', { status: 404 });

    // Compute profitability per line
    const profitDetails = order.lines.map(l => {
      const revenue = Number(l.lineTotalHt);
      const cost = Number(l.unitCostSnapshot) * Number(l.quantity);
      const margin = revenue - cost;
      const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
      return {
        productId: l.productId,
        product: l.product.name,
        quantity: Number(l.quantity),
        revenue,
        cost,
        margin,
        marginPercent: Number(marginPct.toFixed(1)),
      };
    });

    const totalRevenue = Number(order.totalAmountHt);
    const totalCost = profitDetails.reduce((s, d) => s + d.cost, 0);
    const totalMargin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    return NextResponse.json({
      ...order,
      profitability: {
        totalRevenue,
        totalCost,
        totalMargin: Number(totalMargin.toFixed(2)),
        marginPercent: Number(marginPercent.toFixed(1)),
        details: profitDetails,
      }
    });
  } catch (error) {
    console.error('[SALES_ORDER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PATCH /api/sales/orders/[id] — update DRAFT only
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const order = await prisma.salesOrder.findUnique({ where: { id, companyId } });
    if (!order) return new NextResponse('Not found', { status: 404 });
    if (order.status !== 'DRAFT') return new NextResponse('Can only edit DRAFT orders', { status: 400 });

    const body = await request.json();
    const { customerId, dueDate, notes, internalNotes } = body;

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        ...(customerId ? { customerId } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(internalNotes !== undefined ? { internalNotes } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[SALES_ORDER_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
