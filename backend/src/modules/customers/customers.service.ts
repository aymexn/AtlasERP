import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerSegment, CustomerType, PaymentBehavior, RiskLevel } from '@prisma/client';

export interface CustomerFilters {
  segment?: CustomerSegment;
  customerType?: CustomerType;
  paymentBehavior?: PaymentBehavior;
  riskLevel?: RiskLevel;
  isActive?: boolean;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, filters: CustomerFilters = {}) {
    const where: any = { companyId };

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    else where.isActive = true;

    if (filters.segment) where.segment = filters.segment;
    if (filters.customerType) where.customerType = filters.customerType;
    if (filters.paymentBehavior) where.paymentBehavior = filters.paymentBehavior;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        invoices: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmountHt: true },
        },
      },
    });

    // Dynamically calculate totalRevenue and sort
    return customers
      .map((c) => {
        const dynamicRevenue = c.invoices.reduce(
          (acc, inv) => acc + Number(inv.totalAmountHt || 0),
          0,
        );
        return {
          ...c,
          totalRevenue: dynamicRevenue,
          invoices: undefined,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(companyId: string, data: any) {
    return this.prisma.customer.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false }, // Soft delete
    });
  }

  /**
   * Get full performance data for a customer dashboard.
   * Returns: 12-month revenue trend, top products, open orders, unpaid invoices.
   */
  async getPerformanceData(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Revenue this year and all time
    const [
      yearInvoices,
      allTimeStats,
      openOrders,
      unpaidInvoices,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          customerId,
          companyId,
          status: { not: 'CANCELLED' },
          date: { gte: startOfYear },
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          customerId,
          companyId,
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmountHt: true },
      }),
      this.prisma.salesOrder.findMany({
        where: {
          customerId,
          companyId,
          status: { notIn: ['INVOICED', 'CANCELLED'] },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      this.prisma.invoice.findMany({
        where: {
          customerId,
          companyId,
          status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    // 12-month revenue trend (grouped by month)
    const monthlyRevenue = await this.prisma.invoice.groupBy({
      by: ['date'],
      where: {
        customerId,
        companyId,
        status: { not: 'CANCELLED' },
        date: { gte: twelveMonthsAgo },
      },
      _sum: { totalAmountHt: true },
    });

    // Build 12-month array
    const trend: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      });

      const monthRevenue = monthlyRevenue
        .filter((r) => {
          const rDate = new Date(r.date);
          return (
            rDate.getFullYear() === d.getFullYear() &&
            rDate.getMonth() === d.getMonth()
          );
        })
        .reduce((acc, r) => acc + Number(r._sum.totalAmountHt || 0), 0);

      trend.push({ month: monthLabel, revenue: monthRevenue });
    }

    // Top products from sales order lines
    const salesLines = await this.prisma.salesOrderLine.findMany({
      where: {
        salesOrder: { customerId, companyId },
      },
      include: { product: { select: { name: true, sku: true } } },
    });

    // Aggregate product sales
    const productMap = new Map<
      string,
      { name: string; sku: string; qty: number; revenue: number }
    >();
    for (const line of salesLines) {
      const existing = productMap.get(line.productId) || {
        name: line.product.name,
        sku: line.product.sku,
        qty: 0,
        revenue: 0,
      };
      existing.qty += Number(line.quantity);
      existing.revenue += Number(line.lineTotalHt);
      productMap.set(line.productId, existing);
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Summary KPIs
    const totalRevenueAllTime = Number(allTimeStats._sum.totalAmountHt || 0);
    const totalRevenueThisYear = yearInvoices.reduce(
      (acc, inv) => acc + Number(inv.totalAmountHt || 0),
      0,
    );
    const outstandingBalance = unpaidInvoices.reduce(
      (acc, inv) => acc + Number(inv.amountRemaining || 0),
      0,
    );

    return {
      customer: {
        ...customer,
        totalRevenue: totalRevenueAllTime, // Ensure the returned customer object has the correct revenue
      },
      kpis: {
        totalRevenueAllTime,
        totalRevenueThisYear,
        outstandingBalance,
        avgPaymentDelay: customer.avgPaymentDelay,
        segment: customer.segment,
        paymentBehavior: customer.paymentBehavior,
        riskLevel: customer.riskLevel,
      },
      trend,
      topProducts,
      openOrders: openOrders.map((o) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        date: o.date,
        totalAmountTtc: Number(o.totalAmountTtc),
      })),
      unpaidInvoices: unpaidInvoices.map((inv) => ({
        id: inv.id,
        reference: inv.reference,
        date: inv.date,
        totalAmountTtc: Number(inv.totalAmountTtc),
        amountRemaining: Number(inv.amountRemaining),
        status: inv.status,
      })),
    };
  }
}
