import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalCustomers = await prisma.customer.count({ where: { companyId } });
    const newCustomers = await prisma.customer.count({
      where: { 
        companyId, 
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      } 
    });

    return NextResponse.json({
      success: true,
      data: {
        new: newCustomers,
        total: totalCustomers
      }
    });
  } catch (error) {
    console.error('[CUSTOMERS_COUNT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
