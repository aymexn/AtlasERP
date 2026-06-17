import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/format';

// ─────────────────────────────────────────────────────────────────────────────
// SEEDED-COMPANY DETECTION
// We detect the demo company by name (not hardcoded ID) so the flag survives
// database resets. When true, queries order/filter on business-date fields
// (e.g. `date`) instead of `createdAt`, fixing the "il y a 6 min" display.
// Every other company falls back to the original createdAt behaviour.
// ─────────────────────────────────────────────────────────────────────────────
const SEEDED_COMPANY_NAME = 'Cameleon Colors';

export class DashboardService {

  /**
   * Returns whether the company is the seeded demo company.
   * Result is fetched fresh each call – light single-row select.
   */
  private async useBusinessDates(companyId: string): Promise<boolean> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      return company?.name === SEEDED_COMPANY_NAME;
    } catch {
      return false;
    }
  }

  private async getKpis(companyId: string): Promise<Record<string, any>> {
    try {
      const kpis = await prisma.companyKpi.findMany({
        where: { companyId }
      });
      return kpis.reduce((acc, kpi) => {
        acc[kpi.metric] = {
          value: Number(kpi.value),
          metadata: kpi.metadata,
          unit: kpi.unit
        };
        return acc;
      }, {} as Record<string, any>);
    } catch {
      return {};
    }
  }
  
  /**
   * Vue d'Ensemble - Statistiques Commerciales
   */
  async getOverviewStats(companyId: string) {
    const kpis = await this.getKpis(companyId);

    if (kpis['total_sales'] && kpis['revenue_month']) {
      const salesVal = kpis['total_sales'].value;
      const revVal = kpis['revenue_month'].value;
      const averageBasketVal = salesVal > 0 ? revVal / salesVal : 0;

      return {
        sales: {
          current: salesVal,
          previous: 0,
          variance: 0
        },
        averageBasket: {
          current: averageBasketVal,
          previous: 0,
          variance: 0
        },
        newCustomers: {
          current: kpis['new_customers']?.value || 0,
          previous: 0,
          variance: 0
        },
        revenue: {
          current: revVal,
          previous: 0,
          variance: 0
        }
      };
    }

    // FALLBACK
    // For the seeded demo company use the business `date` field so month
    // boundaries reflect the seeded order dates (Dec 2025 – Jun 2026).
    // For all other companies keep the original createdAt path.
    const useBizDates = await this.useBusinessDates(companyId);
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const dateFilter = useBizDates
      ? { date: { gte: thisMonthStart } }
      : { createdAt: { gte: thisMonthStart } };
    const lastDateFilter = useBizDates
      ? { date: { gte: lastMonthStart, lte: lastMonthEnd } }
      : { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } };

    const salesThisMonth = await prisma.salesOrder.count({
      where: { companyId, status: { not: 'CANCELLED' }, ...dateFilter }
    });

    const salesLastMonth = await prisma.salesOrder.count({
      where: { companyId, status: { not: 'CANCELLED' }, ...lastDateFilter }
    });

    const salesValueThisMonth = await prisma.salesOrder.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, ...dateFilter },
      _sum: { totalAmountTtc: true }
    });

    const salesValueLastMonth = await prisma.salesOrder.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, ...lastDateFilter },
      _sum: { totalAmountTtc: true }
    });

    const newCustomersThisMonth = await prisma.customer.count({
      where: { companyId, createdAt: { gte: thisMonthStart } }
    });

    const newCustomersLastMonth = await prisma.customer.count({
      where: { companyId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
    });

    const currentRevenue = Number(salesValueThisMonth._sum.totalAmountTtc || 0);
    const previousRevenue = Number(salesValueLastMonth._sum.totalAmountTtc || 0);

    return {
      sales: {
        current: salesThisMonth,
        previous: salesLastMonth,
        variance: this.calculateVariance(salesThisMonth, salesLastMonth)
      },
      averageBasket: {
        current: salesThisMonth > 0 ? currentRevenue / salesThisMonth : 0,
        previous: salesLastMonth > 0 ? previousRevenue / salesLastMonth : 0,
        variance: this.calculateVariance(
          salesThisMonth > 0 ? currentRevenue / salesThisMonth : 0,
          salesLastMonth > 0 ? previousRevenue / salesLastMonth : 0
        )
      },
      newCustomers: {
        current: newCustomersThisMonth,
        previous: newCustomersLastMonth,
        variance: this.calculateVariance(newCustomersThisMonth, newCustomersLastMonth)
      },
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        variance: this.calculateVariance(currentRevenue, previousRevenue)
      }
    };
  }

  /**
   * Flux de Production
   */
  async getProductionStats(companyId: string) {
    const kpis = await this.getKpis(companyId);

    // Load actual low stock products details
    const allProducts = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        reorderPoint: true
      }
    });

    const lowStockDetails = allProducts.filter(p => {
      const stock = Number(p.stockQuantity || 0);
      const reorder = Number(p.reorderPoint || 10);
      return stock < reorder;
    }).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: Number(p.stockQuantity || 0),
      reorderPoint: Number(p.reorderPoint || 10)
    }));

    // Load actual active manufacturing orders list
    const activeOrdersList = await prisma.manufacturingOrder.findMany({
      where: {
        companyId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] }
      },
      include: {
        product: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const activeOrdersDetails = activeOrdersList.map(mo => {
      const planned = Number(mo.plannedQuantity || 0);
      const produced = Number(mo.producedQuantity || 0);
      return {
        id: mo.id,
        reference: mo.reference,
        productName: mo.product.name,
        plannedQuantity: planned,
        producedQuantity: produced,
        unit: mo.unit,
        progress: planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0,
        status: mo.status
      };
    });

    if (kpis['production_stats']) {
      return {
        activeOrders: kpis['production_stats'].metadata?.inProgress || kpis['production_stats'].value,
        realCost: kpis['production_stats'].metadata?.actualCosts || 0,
        stockAlerts: lowStockDetails.length,
        lowStockProducts: lowStockDetails,
        activeOrdersDetails
      };
    }

    // FALLBACK
    const activeManufacturingOrdersCount = await prisma.manufacturingOrder.count({
      where: {
        companyId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] }
      }
    });

    const totalCostResult = await prisma.manufacturingOrder.aggregate({
      where: {
        companyId,
        status: 'COMPLETED'
      },
      _sum: { totalActualCost: true }
    });

    return {
      activeOrders: activeManufacturingOrdersCount,
      realCost: Number(totalCostResult._sum.totalActualCost || 0),
      stockAlerts: lowStockDetails.length,
      lowStockProducts: lowStockDetails,
      activeOrdersDetails
    };
  }

  /**
   * Forteresse Financière
   */
  async getFinancialStats(companyId: string) {
    const useBizDates = await this.useBusinessDates(companyId);
    const now = new Date();
    const thisMonthStart = startOfMonth(now);

    const dateFilter = useBizDates
      ? { date: { gte: thisMonthStart } }
      : { createdAt: { gte: thisMonthStart } };

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = useBizDates
        ? new Date(Date.UTC(2026, 5 - i, 1))
        : new Date();
      if (!useBizDates) d.setMonth(d.getMonth() - i);
      return {
        start: startOfMonth(d),
        end: endOfMonth(d),
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      };
    }).reverse();

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: { companyId },
        select: { amount: true, date: true, createdAt: true }
      }),
      prisma.expense.findMany({
        where: { companyId },
        select: { amount: true, date: true, createdAt: true }
      })
    ]);

    const treasuryHistory = months.map(month => {
      let received = 0;
      let sent = 0;
      payments.forEach(p => {
        const pDate = useBizDates ? p.date : p.createdAt;
        if (pDate <= month.end) received += Number(p.amount);
      });
      expenses.forEach(e => {
        const eDate = useBizDates ? e.date : e.createdAt;
        if (eDate <= month.end) sent += Number(e.amount);
      });
      return {
        date: month.label,
        balance: received - sent
      };
    });

    const kpis = await this.getKpis(companyId);

    if (kpis['cash_flow']) {
      return {
        cashFlow: kpis['cash_flow'].value,
        invoicedRevenue: kpis['revenue']?.value || 0,
        collected: kpis['collected_revenue']?.value || 0,
        recoveryRate: kpis['recovery_rate']?.value || 0,
        profitability: kpis['profitability']?.value || 0,
        treasuryHistory
      };
    }

    // FALLBACK
    let received = 0;
    let sent = 0;
    payments.forEach(p => received += Number(p.amount));
    expenses.forEach(e => sent += Number(e.amount));

    const cashFlow = received - sent;

    const invoicedRevenue = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['PAID', 'PARTIAL', 'SENT'] },
        ...dateFilter
      },
      _sum: { totalAmountTtc: true }
    });

    const totalInvoiced = Number(invoicedRevenue._sum.totalAmountTtc || 0);

    const collectedRevenue = await prisma.invoice.aggregate({
      where: { 
        companyId,
        ...dateFilter
      },
      _sum: { amountPaid: true }
    });

    const collected = Number(collectedRevenue._sum.amountPaid || 0);

    const recoveryRate = totalInvoiced > 0 ? (collected / totalInvoiced) * 100 : 0;

    const costs = await this.getTotalCosts(companyId);
    const profitability = totalInvoiced > 0 ? ((totalInvoiced - costs) / totalInvoiced) * 100 : 0;

    return {
      cashFlow,
      invoicedRevenue: totalInvoiced,
      collected,
      recoveryRate,
      profitability,
      treasuryHistory
    };
  }

  /**
   * Ressources Humaines
   */
  async getHRStats(companyId: string) {
    const kpis = await this.getKpis(companyId);

    if (kpis['active_employees']) {
      return {
        activeEmployees: kpis['active_employees'].value,
        pendingLeaves: kpis['pending_leaves']?.value || 0,
        activeRecruitments: 0
      };
    }

    // FALLBACK
    const activeEmployees = await prisma.employee.count({
      where: {
        companyId,
        status: 'ACTIVE'
      }
    });

    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'PENDING',
        employee: {
          companyId
        }
      }
    });

    const activeRecruitments = await prisma.jobPosting.count({
      where: {
        companyId,
        status: 'OPEN'
      }
    });

    return {
      activeEmployees,
      pendingLeaves,
      activeRecruitments
    };
  }

  /**
   * Statistiques Logistiques / Achats
   */
  async getLogisticsStats(companyId: string) {
    const kpis = await this.getKpis(companyId);

    if (kpis['procurement_stats']) {
      return {
        pendingValue: kpis['procurement_stats'].metadata?.pendingValue || 0,
        pendingCount: kpis['procurement_stats'].metadata?.pendingCount || 0,
        topSuppliers: kpis['procurement_stats'].metadata?.topSuppliers || []
      };
    }

    // FALLBACK
    const pendingOrders = await prisma.purchaseOrder.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] }
      },
      select: { totalTtc: true }
    });

    const pendingValue = pendingOrders.reduce((acc, po) => acc + Number(po.totalTtc), 0);

    const topSuppliersRaw = await prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: { companyId, status: { not: 'CANCELLED' } },
      _sum: { totalTtc: true },
      orderBy: { _sum: { totalTtc: 'desc' } },
      take: 5
    });

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: topSuppliersRaw.map(s => s.supplierId) } },
      select: { id: true, name: true }
    });

    const topSuppliers = topSuppliersRaw.map(s => ({
      name: suppliers.find(sup => sup.id === s.supplierId)?.name || 'Inconnu',
      value: Number(s._sum.totalTtc || 0)
    }));

    return {
      pendingValue,
      pendingCount: pendingOrders.length,
      topSuppliers
    };
  }

  /**
   * Statistiques Ventes / Commercial
   */
  async getSalesStats(companyId: string) {
    const kpis = await this.getKpis(companyId);

    if (kpis['sales_stats']) {
      return {
        monthlyRevenue: kpis['revenue_month']?.value || 0,
        activeOrders: kpis['sales_stats'].metadata?.activeOrders || 0,
        chartData: kpis['sales_stats'].metadata?.chartData || [],
        topSellingProducts: kpis['sales_stats'].metadata?.topSellingProducts || []
      };
    }

    // FALLBACK
    // Seeded company: use business `date` field for time-based filters so the
    // chart reflects real order dates (Dec 2025 – Jun 2026) instead of now.
    const useBizDates = await this.useBusinessDates(companyId);
    const now = new Date();
    const thisMonthStart = startOfMonth(now);

    const monthlyInvoices = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['PAID', 'PARTIAL', 'SENT', 'OVERDUE'] },
        date: { gte: thisMonthStart }
      },
      _sum: { totalAmountTtc: true }
    });

    const activeOrders = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { in: ['VALIDATED', 'PREPARING', 'SHIPPED'] }
      }
    });

    // For the seeded company the chart should show the 6 months of seeded data
    // (Dec 2025 – Jun 2026). We keep the rolling-6-months window but order by
    // the business date field so months with seeded orders are non-zero.
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = useBizDates
        ? new Date(Date.UTC(2026, 5 - i, 1)) // anchor at Jun 2026
        : new Date();
      if (!useBizDates) d.setMonth(d.getMonth() - i);
      return {
        start: startOfMonth(d),
        end: endOfMonth(d),
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      };
    }).reverse();

    const chartData = await Promise.all(last6Months.map(async (month) => {
      const monthRevenue = await prisma.salesOrder.aggregate({
        where: useBizDates
          ? { companyId, status: { not: 'CANCELLED' }, date: { gte: month.start, lte: month.end } }
          : { companyId, status: { not: 'CANCELLED' }, createdAt: { gte: month.start, lte: month.end } },
        _sum: { totalAmountTtc: true }
      });

      return {
        date: month.label,
        revenue: Number(monthRevenue._sum.totalAmountTtc || 0)
      };
    }));

    const topProductsRaw = await prisma.salesOrderLine.groupBy({
      by: ['productId'],
      where: { salesOrder: { companyId, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, lineTotalTtc: true },
      orderBy: { _sum: { lineTotalTtc: 'desc' } },
      take: 5
    });

    const products = await prisma.product.findMany({
      where: { id: { in: topProductsRaw.map(p => p.productId) } },
      select: { id: true, name: true }
    });

    const topSellingProducts = topProductsRaw.map(p => ({
      id: p.productId,
      name: products.find(prod => prod.id === p.productId)?.name || 'Article Inconnu',
      quantity: Number(p._sum.quantity || 0),
      revenue: Number(p._sum.lineTotalTtc || 0)
    }));

    return {
      monthlyRevenue: Number(monthlyInvoices._sum.totalAmountTtc || 0),
      activeOrders,
      chartData,
      topSellingProducts
    };
  }

  async getRecentActivity(companyId: string) {
    try {
      // ── Conditional ordering ──────────────────────────────────────────────
      // Seeded company  → order by business date fields so the feed shows
      //                   real Dec 2025 – Jun 2026 activity, not "6 min ago".
      // All other companies → keep original createdAt ordering (no change).
      const useBizDates = await this.useBusinessDates(companyId);

      const [orders, payments, newCustomers, allProducts] = await Promise.all([
        // Recent orders
        prisma.salesOrder.findMany({
          where: { companyId },
          take: 5,
          orderBy: useBizDates ? { date: 'desc' } : { createdAt: 'desc' },
          include: { customer: true }
        }),

        // Recent payments
        prisma.payment.findMany({
          where: { companyId },
          take: 5,
          orderBy: useBizDates ? { date: 'desc' } : { createdAt: 'desc' },
          include: { invoice: { include: { customer: true } } }
        }),

        // New customers (always by createdAt — no business-date field on Customer)
        prisma.customer.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }),

        // Low stock products
        prisma.product.findMany({
          where: { companyId, isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
            reorderPoint: true,
            updatedAt: true
          }
        })
      ]);

      const lowStockProducts = allProducts.filter(p => {
        const stock = Number(p.stockQuantity || 0);
        const reorder = Number(p.reorderPoint || 10);
        return stock < reorder;
      });

      const activities: any[] = [];

      // Transform orders
      // Seeded company: expose the business `date` as the activity timestamp
      // so relative-time helpers display e.g. "il y a 3 mois" not "il y a 6 min".
      orders.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          timestamp: useBizDates ? order.date : order.createdAt,
          user: 'Utilisateur',
          action: `${order.reference} créé`,
          type: 'order',
          icon: '🟢',
          link: `/sales/orders/${order.id}`,
          customer: order.customer.name,
          amount: Number(order.totalAmountTtc)
        });
      });

      // Transform payments
      payments.forEach(payment => {
        activities.push({
          id: `payment-${payment.id}`,
          timestamp: useBizDates ? payment.date : payment.createdAt,
          user: 'Comptable',
          action: `Paiement reçu : ${formatCurrency(payment.amount)}`,
          type: 'payment',
          icon: '💰',
          link: `/invoices`,
          customer: payment.invoice.customer.name,
          amount: Number(payment.amount)
        });
      });

      // Transform new customers
      newCustomers.forEach(customer => {
        activities.push({
          id: `customer-${customer.id}`,
          timestamp: customer.createdAt,
          user: 'Commercial',
          action: `Nouveau client ajouté : ${customer.name}`,
          type: 'customer',
          icon: '👤',
          link: `/sales/customers`,
          customer: customer.name
        });
      });

      // Transform stock alerts
      lowStockProducts.forEach(product => {
        activities.push({
          id: `alert-${product.id}`,
          timestamp: product.updatedAt || new Date(),
          user: 'Système',
          action: `${product.name} en rupture`,
          type: 'stock',
          icon: '🔴',
          link: `/inventory/stock-status`,
          product: product.name,
          sku: product.sku,
          stock: `${Number(product.stockQuantity)} / ${Number(product.reorderPoint)}`
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, 10);
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }

  /**
   * KPI Détaillés (pour le dashboard principal)
   */
  async getDetailedKpis(companyId: string) {
    const kpis = await this.getKpis(companyId);

    if (kpis['health_score']) {
      return {
        revenue: kpis['revenue_month']?.value || 0,
        totalOrders: kpis['total_sales']?.value || 0,
        newCustomers: kpis['new_customers']?.value || 0,
        criticalStock: kpis['stock_alerts']?.value || 0,
        health: kpis['health_score'].metadata || {
          score: kpis['health_score'].value || 85,
          factors: { profitability: 'healthy', stock: 'healthy', commercial: 'healthy' }
        }
      };
    }

    // FALLBACK
    const revenue = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['PAID', 'PARTIAL', 'SENT'] }
      },
      _sum: { totalAmountTtc: true }
    });

    const totalOrders = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { not: 'CANCELLED' }
      }
    });

    const newCustomers = await prisma.customer.count({
      where: {
        companyId,
        createdAt: { gte: startOfMonth(new Date()) }
      }
    });

    const products = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true
      },
      select: {
        stockQuantity: true,
        reorderPoint: true
      }
    });
    const criticalStock = products.filter(p => {
      const stock = Number(p.stockQuantity || 0);
      const reorder = Number(p.reorderPoint || 10);
      return stock < reorder;
    }).length;

    const totalCosts = await this.getTotalCosts(companyId);
    const revValue = Number(revenue._sum.totalAmountTtc || 0);
    const profitability = revValue > 0 ? ((revValue - totalCosts) / revValue) * 100 : 0;
    
    let score = 100;
    if (profitability < 15) score -= 20;
    if (criticalStock > 5) score -= 15;
    if (totalOrders === 0) score -= 30;

    return {
      revenue: revValue,
      totalOrders,
      newCustomers,
      criticalStock,
      health: {
        score: Math.max(10, Math.min(100, Math.round(score))),
        factors: {
          profitability: profitability > 15 ? 'healthy' : 'attention',
          stock: criticalStock === 0 ? 'healthy' : 'attention',
          commercial: totalOrders > 0 ? 'healthy' : 'attention'
        }
      }
    };
  }

  /**
   * KPI Ventes (Bons de Commande Client)
   */
  async getSalesOrderKpis(companyId: string) {
    // Always compute directly — the cached getKpis() path reads wrong buckets
    // BC ouverts = orders not yet invoiced or cancelled (active pipeline)
    const OPEN_STATUSES = ['DRAFT', 'CONFIRMED', 'VALIDATED', 'PREPARING', 'SHIPPED'] as const;
    // CA engagé = committed revenue = validated/preparing/shipped but NOT yet invoiced
    const COMMITTED_STATUSES = ['VALIDATED', 'PREPARING', 'SHIPPED'] as const;

    const [openOrders, committedAgg, totalSalesOrders, products] = await Promise.all([
      prisma.salesOrder.count({
        where: { companyId, status: { in: OPEN_STATUSES as any } }
      }),
      prisma.salesOrder.aggregate({
        where: { companyId, status: { in: COMMITTED_STATUSES as any } },
        _sum: { totalAmountTtc: true }
      }),
      prisma.salesOrder.count({
        where: { companyId, status: { not: 'CANCELLED' } }
      }),
      prisma.product.findMany({
        where: { companyId, isActive: true },
        select: { stockQuantity: true, reorderPoint: true }
      })
    ]);

    const stockAlerts = products.filter(p => {
      const stock = Number(p.stockQuantity || 0);
      const reorder = Number(p.reorderPoint || 10);
      return stock < reorder;
    }).length;

    return {
      openOrders,
      committedRevenue: Number(committedAgg._sum.totalAmountTtc || 0),
      totalSalesOrders,
      stockAlerts
    };
  }


  private async getTotalCosts(companyId: string): Promise<number> {
    const [purchases, expenses] = await Promise.all([
      prisma.purchaseOrder.aggregate({
        where: { companyId, status: { not: 'CANCELLED' } },
        _sum: { totalTtc: true }
      }),
      prisma.expense.aggregate({
        where: { companyId },
        _sum: { amount: true }
      })
    ]);

    return (
      Number(purchases._sum.totalTtc || 0) +
      Number(expenses._sum.amount || 0)
    );
  }

  private calculateVariance(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
}

export const dashboardService = new DashboardService();
