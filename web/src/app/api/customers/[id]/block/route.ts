import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: {
        id: id,
        companyId,
      },
    });

    if (!customer) return new NextResponse('Not found', { status: 404 });

    const updatedCustomer = await prisma.customer.update({
      where: { id: id, companyId },
      data: { isBlocked: !customer.isBlocked },
    });

    return NextResponse.json({ success: true, isBlocked: updatedCustomer.isBlocked });
  } catch (error) {
    console.error('[CUSTOMER_BLOCK]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
