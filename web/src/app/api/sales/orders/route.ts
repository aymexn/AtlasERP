import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { requirePermission } from '@/lib/require-permission';

const TVA_RATE = 0.19;

function calcOrderTotals(
  lines: { quantity: number; unitPriceHt: number; discountPercent: number }[],
  globalDiscountPercent: number,
  shippingCost: number
) {
  const subtotalHt = lines.reduce((sum, l) => {
    const lineHt = l.quantity * l.unitPriceHt * (1 - (l.discountPercent || 0) / 100);
    return sum + lineHt;
  }, 0);
  const totalHtAfterDiscount = subtotalHt * (1 - (globalDiscountPercent || 0) / 100);
  const totalTva = totalHtAfterDiscount * TVA_RATE;
  const totalTtc = totalHtAfterDiscount + totalTva + (shippingCost || 0);
  return {
    totalAmountHt: Number(totalHtAfterDiscount.toFixed(2)),
    totalAmountTva: Number(totalTva.toFixed(2)),
    totalAmountTtc: Number(totalTtc.toFixed(2)),
  };
}

async function generateReference(companyId: string): Promise<string> {
  const now = new Date();
  const yymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await prisma.salesOrder.count({
    where: { companyId, reference: { startsWith: `BC-${yymm}` } },
  });
  return `BC-${yymm}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/sales/orders — list with filters
export async function GET(request: Request) {
  try {
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const denied = await requirePermission('sales', 'order', 'read', request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search') || '';

    const orders = await prisma.salesOrder.findMany({
      where: {
        companyId,
        ...(status ? { status: status as any } : {}),
        ...(customerId ? { customerId } : {}),
        ...(dateFrom || dateTo ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
          }
        } : {}),
        ...(search ? {
          OR: [
            { reference: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
          ]
        } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, standardCost: true, stockQuantity: true, stockReserved: true } }
          }
        },
        invoice: { select: { id: true, reference: true, status: true } }
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[SALES_ORDERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/sales/orders — create draft
export async function POST(request: Request) {
  try {
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const denied = await requirePermission('sales', 'order', 'create', request);
    if (denied) return denied;

    const body = await request.json();
    const { customerId, dueDate, notes, internalNotes, shippingCost = 0, discountPercent = 0, lines } = body;

    if (!customerId) return new NextResponse('customerId is required', { status: 400 });
    if (!lines || lines.length === 0) return new NextResponse('At least one line is required', { status: 400 });

    // Enrich lines with product data
    const enrichedLines = await Promise.all(
      lines.map(async (l: any) => {
        const product = await prisma.product.findUnique({ where: { id: l.productId } });
        if (!product) throw new Error(`Product ${l.productId} not found`);
        const lineHt = Number(l.quantity) * Number(l.unitPriceHt) * (1 - (Number(l.discountPercent) || 0) / 100);
        const lineTtc = lineHt * (1 + TVA_RATE);
        return {
          productId: l.productId,
          quantity: Number(l.quantity),
          unit: product.unit || 'pcs',
          unitPriceHt: Number(l.unitPriceHt),
          unitCostSnapshot: Number(product.standardCost || 0),
          discountPercent: Number(l.discountPercent || 0),
          taxRate: TVA_RATE,
          lineTotalHt: Number(lineHt.toFixed(2)),
          lineTotalTtc: Number(lineTtc.toFixed(2)),
        };
      })
    );

    const totals = calcOrderTotals(
      lines.map((l: any) => ({ quantity: Number(l.quantity), unitPriceHt: Number(l.unitPriceHt), discountPercent: Number(l.discountPercent || 0) })),
      discountPercent,
      shippingCost
    );

    const reference = await generateReference(companyId);

    const order = await prisma.salesOrder.create({
      data: {
        companyId,
        customerId,
        reference,
        status: 'DRAFT',
        date: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        internalNotes,
        shippingCost,
        discountPercent,
        ...totals,
        lines: { create: enrichedLines },
      },
      include: {
        customer: { select: { id: true, name: true } },
        lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('[SALES_ORDERS_POST]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
