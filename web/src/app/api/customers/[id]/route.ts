import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id, companyId },
      include: {
        contacts: true,
        invoices: {
          where: { status: { not: 'CANCELLED' as any } },
          orderBy: { date: 'desc' }
        },
        salesOrders: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!customer) return new NextResponse('Not found', { status: 404 });

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(now.getDate() - 365);

    let caTotal = 0;
    let ca365 = 0;
    let encours = 0;
    let maxOverdueDays = 0;
    let hasUnpaidOver15Days = false;
    let hasUnpaidOver45Days = false;
    let unpaidInvoices: any[] = [];

    if (customer.invoices.length > 0) {
      customer.invoices.forEach(inv => {
        const invTtc = Number(inv.totalAmountTtc || 0);
        caTotal += invTtc;
        if (new Date(inv.date) >= oneYearAgo) {
          ca365 += invTtc;
        }

        const amountPaid = Number(inv.amountPaid || 0);
        const remaining = invTtc - amountPaid;

        if (inv.status === 'SENT' || inv.status === 'OVERDUE' || inv.status === 'PARTIAL' || remaining > 0) {
          encours += remaining;
          
          let daysOverdue = 0;
          if (inv.dueDate && new Date() > new Date(inv.dueDate)) {
            daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));
            if (daysOverdue > maxOverdueDays) maxOverdueDays = daysOverdue;
            if (daysOverdue > 15) hasUnpaidOver15Days = true;
            if (daysOverdue > 45) hasUnpaidOver45Days = true;
          }

          unpaidInvoices.push({
            id: inv.id,
            reference: inv.reference,
            date: inv.date,
            dueDate: inv.dueDate,
            totalAmountTtc: invTtc,
            amountRemaining: remaining,
            status: inv.status,
            daysOverdue
          });
        }
      });
    } else {
      const deliveredOrders = customer.salesOrders.filter(so => 
        ['DELIVERED', 'INVOICED', 'SHIPPED', 'VALIDATED'].includes(so.status as string)
      );
      deliveredOrders.forEach(so => {
        const soTtc = Number(so.totalAmountTtc || 0);
        caTotal += soTtc;
        if (new Date(so.date) >= oneYearAgo) {
          ca365 += soTtc;
        }
      });
    }

    let dso = 0;
    if (ca365 > 0) {
      dso = Math.round((encours / ca365) * 365);
    }
    if (encours > 0 && ca365 > 0 && dso < 1) dso = 1;

    let computedRisk = 'LOW';
    if (dso > 60 || customer.isBlocked || hasUnpaidOver45Days) {
      computedRisk = 'HIGH';
    } else if (dso > 30 || dso <= 60 && hasUnpaidOver15Days) {
      computedRisk = 'MODERATE';
    } else if (hasUnpaidOver15Days) {
      computedRisk = 'MODERATE';
    }

    // Since ABC segmentation requires global knowledge, we just return the local KPIs.
    // The list API does the global segmentation. Here we just compute local KPIs.
    return NextResponse.json({
      ...customer,
      caTotal,
      encours,
      dso,
      riskLevel: computedRisk,
      unpaidInvoices
    });
  } catch (error) {
    console.error('[CUSTOMER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await request.json();
    const { name, email, phone, address, taxId, customerType, creditLimit, notes } = body;

    const customer = await prisma.customer.update({
      where: { id, companyId },
      data: {
        name,
        email,
        phone,
        address,
        taxId,
        customerType,
        notes,
        creditLimit: creditLimit ? Number(creditLimit) : 0,
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('[CUSTOMER_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const relatedOrders = await prisma.salesOrder.count({
      where: { customerId: id, companyId }
    });
    const relatedInvoices = await prisma.invoice.count({
      where: { customerId: id, companyId }
    });

    if (relatedOrders > 0 || relatedInvoices > 0) {
      // Soft Delete
      await prisma.customer.update({
        where: { id, companyId },
        data: { isActive: false }
      });
      return NextResponse.json({ message: 'Customer deactivated' });
    }

    await prisma.customer.delete({
      where: { id, companyId }
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[CUSTOMER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
