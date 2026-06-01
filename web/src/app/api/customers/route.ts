import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const segmentFilter = searchParams.get('segment');
    const riskFilter = searchParams.get('risk');

    // 1. Fetch customers with invoices and salesOrders
    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        isActive: true,
        name: { contains: search, mode: 'insensitive' },
      },
      include: {
        invoices: {
          where: { status: { not: 'CANCELLED' as any } }
        },
        salesOrders: {
          where: { status: { in: ['DELIVERED' as any, 'INVOICED' as any, 'SHIPPED' as any, 'VALIDATED' as any] } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(now.getDate() - 365);

    // 2. Compute dynamic KPIs for each customer
    const customersWithKpi = customers.map(customer => {
      let caTotal = 0;
      let ca365 = 0;
      let encours = 0;
      let maxOverdueDays = 0;
      let hasUnpaidOver15Days = false;
      let hasUnpaidOver45Days = false;

      // Calculate CA and Overdue from Invoices
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

            if (inv.dueDate && new Date() > new Date(inv.dueDate)) {
              const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));
              if (daysOverdue > maxOverdueDays) maxOverdueDays = daysOverdue;

              if (daysOverdue > 15) hasUnpaidOver15Days = true;
              if (daysOverdue > 45) hasUnpaidOver45Days = true;
            }
          }
        });
      } else {
        // If no invoices, use delivered/invoiced sales orders for CA
        const deliveredOrders = customer.salesOrders.filter(so => 
          ['DELIVERED', 'INVOICED'].includes(so.status as string)
        );
        deliveredOrders.forEach(so => {
          const soTtc = Number(so.totalAmountTtc || 0);
          caTotal += soTtc;
          if (new Date(so.date) >= oneYearAgo) {
            ca365 += soTtc;
          }
        });
      }

      // Calculate DSO (Encours / CA 365j) * 365
      let dso = 0;
      if (ca365 > 0) {
        dso = Math.round((encours / ca365) * 365);
      }
      if (encours > 0 && ca365 > 0 && dso < 1) dso = 1;

      // Calculate Risk Level
      let computedRisk = 'LOW';
      if (dso > 60 || customer.isBlocked || hasUnpaidOver45Days) {
        computedRisk = 'HIGH';
      } else if (dso > 30 || dso <= 60 && hasUnpaidOver15Days) {
        computedRisk = 'MODERATE';
      } else if (hasUnpaidOver15Days) {
        computedRisk = 'MODERATE'; // Fallback to moderate if unpaid > 15d despite low DSO
      }

      return {
        ...customer,
        _caTotal: caTotal,
        _encours: encours,
        _dso: dso,
        _computedRisk: computedRisk
      };
    });

    // 3. Dynamic ABC Segmentation (A=80%, B=95%, C=100%)
    customersWithKpi.sort((a, b) => b._caTotal - a._caTotal);
    
    const globalRevenue = customersWithKpi.reduce((sum, c) => sum + c._caTotal, 0);
    let cumulatedRevenue = 0;

    const finalCustomers = customersWithKpi.map(customer => {
      cumulatedRevenue += customer._caTotal;
      const percentage = globalRevenue > 0 ? (cumulatedRevenue / globalRevenue) * 100 : 0;
      
      let computedSegment = 'C';
      if (percentage <= 80 || (customer._caTotal > 0 && customersWithKpi.length === 1)) {
        computedSegment = 'A';
      } else if (percentage <= 95) {
        computedSegment = 'B';
      }

      const { invoices, salesOrders, ...customerData } = customer;

      return {
        ...customerData,
        caTotal: customer._caTotal,
        encours: customer._encours,
        dso: customer._dso,
        segment: computedSegment,
        riskLevel: customer._computedRisk
      };
    });

    // 4. Apply specific filters
    let filteredResults = finalCustomers;
    if (segmentFilter) {
      const segments = segmentFilter.split(',');
      filteredResults = filteredResults.filter(c => segments.includes(c.segment));
    }
    if (riskFilter) {
      const risks = riskFilter.split(',');
      filteredResults = filteredResults.filter(c => risks.includes(c.riskLevel));
    }

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error('[CUSTOMERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await request.json();
    const { name, email, phone, address, taxId, customerType, creditLimit, notes } = body;

    if (!name) return new NextResponse('Name is required', { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        companyId,
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
    console.error('[CUSTOMERS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
