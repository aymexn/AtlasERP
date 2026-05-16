import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getKPIs(companyId: string, period: string = 'month') {
    const startDate = this.getStartDateForPeriod(period);

    // 1. Revenue (CA) - current period
    const sales = await this.prisma.salesOrder.aggregate({
      _sum: { totalAmountTtc: true },
      where: {
        companyId,
        date: { gte: startDate },
        status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] as any }
      }
    });
    const revenue = Number(sales._sum.totalAmountTtc || 0);

    // Previous period revenue for comparison
    const prevStartDate = this.getStartDateForPeriod(period, 2);
    const prevSales = await this.prisma.salesOrder.aggregate({
      _sum: { totalAmountTtc: true },
      where: {
        companyId,
        date: { gte: prevStartDate, lt: startDate },
        status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] as any }
      }
    });
    const prevRevenue = Number(prevSales._sum.totalAmountTtc || 0);
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    // 2. Margin (based on cost vs sell price)
    // Approximate: (totalAmountHt - cost basis) / totalAmountHt
    const salesHt = await this.prisma.salesOrder.aggregate({
      _sum: { totalAmountHt: true },
      where: {
        companyId,
        date: { gte: startDate },
        status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] as any }
      }
    });
    const revenueHt = Number(salesHt._sum.totalAmountHt || 0);
    const margin = revenueHt > 0 ? 32.5 : 0; // Placeholder – real margin needs cost data

    // 3. Active Orders
    const activeOrders = await this.prisma.salesOrder.count({
      where: {
        companyId,
        status: { in: ['VALIDATED', 'PREPARING', 'SHIPPED'] as any }
      }
    });

    // 4. Stock-out rate
    const totalProducts = await this.prisma.product.count({ where: { companyId, isActive: true } });
    const outOfStock = await this.prisma.product.count({
      where: { companyId, isActive: true, stockQuantity: { lte: 0 } }
    });
    const stockOutRate = totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0;

    return {
      revenue,
      revenueChange,
      margin,
      activeOrders,
      stockOutRate
    };
  }

  async getImminentRupture(companyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Pull all sales order lines for the last 30 days
    const lines = await this.prisma.salesOrderLine.findMany({
      where: {
        salesOrder: {
          companyId,
          date: { gte: thirtyDaysAgo },
          status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] as any }
        }
      },
      select: { productId: true, quantity: true }
    });

    // Aggregate velocity per product
    const velocityMap = new Map<string, number>();
    for (const l of lines) {
      const current = velocityMap.get(l.productId) || 0;
      velocityMap.set(l.productId, current + Number(l.quantity));
    }

    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        stockQuantity: { gt: 0 }
      },
      select: { id: true, name: true, sku: true, stockQuantity: true, unit: true }
    });

    const alerts: any[] = [];
    for (const p of products) {
      const totalSold30d = velocityMap.get(p.id) || 0;
      const dailyVelocity = totalSold30d / 30;

      if (dailyVelocity > 0) {
        const daysRemaining = Number(p.stockQuantity) / dailyVelocity;
        if (daysRemaining < 7) {
          alerts.push({
            id: p.id,
            name: p.name,
            sku: p.sku,
            stock: Number(p.stockQuantity),
            unit: p.unit,
            velocity: dailyVelocity.toFixed(2),
            daysRemaining: Math.round(daysRemaining),
            predictionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
          });
        }
      }
    }

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  async getSurstock(companyId: string) {
    // Products with very high stock and near-zero velocity
    return [];
  }

  async getPaymentDelays(companyId: string) {
    return this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'PARTIAL'] as any },
        dueDate: { lt: new Date() }
      },
      include: { customer: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 10
    });
  }

  async getProductionBottlenecks(companyId: string) {
    const inProgressMOs = await this.prisma.manufacturingOrder.findMany({
      where: { companyId, status: 'IN_PROGRESS' },
      include: {
        lines: {
          include: {
            component: {
              select: { name: true, stockQuantity: true, unit: true }
            }
          }
        }
      }
    });

    const bottlenecks: any[] = [];
    for (const mo of inProgressMOs) {
      for (const line of mo.lines) {
        const needed = Number(line.requiredQuantity) - Number((line as any).consumedQuantity || 0);
        const available = Number(line.component.stockQuantity);
        if (needed > available) {
          bottlenecks.push({
            moReference: mo.reference,
            moId: mo.id,
            componentName: line.component.name,
            needed,
            available,
            unit: line.component.unit,
            shortage: needed - available
          });
        }
      }
    }
    return bottlenecks;
  }

  async getRevenueEvolution(companyId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await this.prisma.salesOrder.findMany({
      where: {
        companyId,
        date: { gte: startDate },
        status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] as any }
      },
      select: { date: true, totalAmountTtc: true },
      orderBy: { date: 'asc' }
    });

    const result: { date: string; amount: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dailyTotal = sales
        .filter(s => s.date.toISOString().split('T')[0] === dateStr)
        .reduce((sum, s) => sum + Number(s.totalAmountTtc), 0);

      result.push({ date: dateStr, amount: dailyTotal });
    }
    return result;
  }

  async getTopProducts(companyId: string, limit: number = 5) {
    // Use findMany + in-memory aggregation to avoid Prisma groupBy circular type issue
    const lines = await this.prisma.salesOrderLine.findMany({
      where: {
        salesOrder: {
          companyId,
          status: 'INVOICED' as any
        }
      },
      select: {
        productId: true,
        quantity: true,
        lineTotalTtc: true,
        product: { select: { name: true } }
      }
    });

    // Aggregate by productId
    const aggregated = new Map<string, { name: string; totalRevenue: number; totalQuantity: number }>();
    for (const l of lines) {
      const existing = aggregated.get(l.productId);
      if (existing) {
        existing.totalRevenue += Number(l.lineTotalTtc);
        existing.totalQuantity += Number(l.quantity);
      } else {
        aggregated.set(l.productId, {
          name: l.product.name,
          totalRevenue: Number(l.lineTotalTtc),
          totalQuantity: Number(l.quantity)
        });
      }
    }

    return Array.from(aggregated.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  async getCategoryDistribution(companyId: string) {
    const families = await this.prisma.productFamily.findMany({
      where: { companyId },
      include: {
        products: {
          include: {
            salesOrderLines: {
              where: { salesOrder: { status: 'INVOICED' as any } },
              select: { lineTotalTtc: true }
            }
          }
        }
      }
    });

    return families.map(f => {
      const revenue = f.products.reduce((sum, p) => {
        return sum + p.salesOrderLines.reduce((s, l) => s + Number(l.lineTotalTtc), 0);
      }, 0);
      return { name: f.name, value: revenue };
    }).filter(f => f.value > 0);
  }

  async getRecentTransactions(companyId: string, limit: number = 10) {
    return this.prisma.stockMovement.findMany({
      where: { companyId },
      include: {
        product: { select: { name: true, unit: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  private getStartDateForPeriod(period: string, multiplier: number = 1): Date {
    const d = new Date();
    switch (period) {
      case 'week': d.setDate(d.getDate() - (7 * multiplier)); break;
      case 'month': d.setMonth(d.getMonth() - (1 * multiplier)); break;
      case 'quarter': d.setMonth(d.getMonth() - (3 * multiplier)); break;
      case 'year': d.setFullYear(d.getFullYear() - (1 * multiplier)); break;
      default: d.setMonth(d.getMonth() - 1);
    }
    return d;
  }
}
