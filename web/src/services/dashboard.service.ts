import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export class DashboardService {
  
  /**
   * Vue d'Ensemble - Statistiques Commerciales
   */
  async getOverviewStats(companyId: string) {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Total ventes ce mois
    const salesThisMonth = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: thisMonthStart }
      }
    });

    const salesLastMonth = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    });

    // Panier moyen (valeur des ventes / nombre de ventes)
    const salesValueThisMonth = await prisma.salesOrder.aggregate({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: thisMonthStart }
      },
      _sum: { totalAmountTtc: true }
    });

    const salesValueLastMonth = await prisma.salesOrder.aggregate({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
      },
      _sum: { totalAmountTtc: true }
    });

    // Nouveaux clients ce mois
    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        companyId,
        createdAt: { gte: thisMonthStart }
      }
    });

    const newCustomersLastMonth = await prisma.customer.count({
      where: {
        companyId,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
      }
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
    // Ordres en cours (PO non complètement reçus)
    const activePurchaseOrders = await prisma.purchaseOrder.count({
      where: {
        companyId,
        status: { notIn: ['FULLY_RECEIVED', 'CANCELLED'] }
      }
    });

    // Coût réel (total des PO validés non annulés)
    const totalCost = await prisma.purchaseOrder.aggregate({
      where: {
        companyId,
        status: { not: 'CANCELLED' }
      },
      _sum: { totalTtc: true }
    });

    // Alertes ruptures (produits avec stock <= 0 OU stock <= minStock)
    const stockAlerts = await prisma.product.count({
      where: {
        companyId,
        isActive: true,
        OR: [
          { stockQuantity: { lte: 0 } },
          { 
            AND: [
              { minStock: { gt: 0 } },
              { stockQuantity: { lte: prisma.product.fields.minStock } }
            ]
          }
        ]
      }
    });

    return {
      activeOrders: activePurchaseOrders,
      realCost: Number(totalCost._sum.totalTtc || 0),
      stockAlerts: stockAlerts
    };
  }

  /**
   * Forteresse Financière
   */
  async getFinancialStats(companyId: string) {
    // Trésorerie réelle = Encaissements - Décaissements
    const payments = await prisma.payment.findMany({
      where: { companyId },
      select: { amount: true, type: true }
    });

    let received = 0;
    let sent = 0;
    payments.forEach(p => {
      if ((p as any).type === 'INFLOW' || (p as any).type === 'RECEIVED') received += Number(p.amount);
      else sent += Number(p.amount);
    });

    const cashFlow = received - sent;

    // CA Facturé = Total des factures émises
    const invoicedRevenue = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['PAID', 'PARTIAL', 'SENT', 'OVERDUE'] }
      },
      _sum: { totalAmountTtc: true }
    });

    const totalInvoiced = Number(invoicedRevenue._sum.totalAmountTtc || 0);

    // Encaissé = Somme des montants payés sur les factures
    const collectedRevenue = await prisma.invoice.aggregate({
      where: { companyId },
      _sum: { amountPaid: true }
    });

    const collected = Number(collectedRevenue._sum.amountPaid || 0);

    // Taux de recouvrement
    const recoveryRate = totalInvoiced > 0 ? (collected / totalInvoiced) * 100 : 0;

    // Profitabilité
    const costs = await this.getTotalCosts(companyId);
    const profitability = totalInvoiced > 0 ? ((totalInvoiced - costs) / totalInvoiced) * 100 : 0;

    return {
      cashFlow,
      invoicedRevenue: totalInvoiced,
      collected,
      recoveryRate,
      profitability
    };
  }

  /**
   * Ressources Humaines
   */
  async getHRStats(companyId: string) {
    // Employés actifs
    const activeEmployees = await prisma.employee.count({
      where: { companyId, status: 'ACTIVE' }
    });

    // Congés en attente
    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: 'PENDING'
      }
    });

    // Pipeline recrutement actif
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
    // Achats en transit (PO non reçus)
    const pendingOrders = await prisma.purchaseOrder.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] }
      },
      select: { totalTtc: true }
    });

    const pendingValue = pendingOrders.reduce((acc, po) => acc + Number(po.totalTtc), 0);

    // Top Fournisseurs
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
    const now = new Date();
    const thisMonthStart = startOfMonth(now);

    // Volume mensuel
    const monthlySales = await prisma.salesOrder.aggregate({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: thisMonthStart }
      },
      _sum: { totalAmountTtc: true }
    });

    // Ordres en cours
    const activeOrders = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { in: ['CONFIRMED', 'VALIDATED', 'PREPARING', 'SHIPPED'] }
      }
    });

    // Chart Data (7 derniers jours)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const chartData = await Promise.all(last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRevenue = await prisma.salesOrder.aggregate({
        where: {
          companyId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: date, lt: nextDay }
        },
        _sum: { totalAmountTtc: true }
      });

      return {
        date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue: Number(dayRevenue._sum.totalAmountTtc || 0)
      };
    }));

    // Top Ventes Articles
    const topProductsRaw = await prisma.salesOrderLine.groupBy({
      by: ['productId'],
      where: { order: { companyId, status: { not: 'CANCELLED' } } },
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
      monthlyRevenue: Number(monthlySales._sum.totalAmountTtc || 0),
      activeOrders,
      chartData,
      topSellingProducts
    };
  }

  /**
   * Activité Récente
   */
  async getRecentActivity(companyId: string) {
    const logs = await prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      user: `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim() || 'Système',
      description: log.action || 'Action système',
      type: log.action.toLowerCase()
    }));
  }

  /**
   * KPI Détaillés (pour le dashboard principal)
   */
  async getDetailedKpis(companyId: string) {
    // Revenus (factures validées)
    const revenue = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ['PAID', 'PARTIAL', 'SENT', 'OVERDUE'] }
      },
      _sum: { totalAmountTtc: true }
    });

    // Commandes (total actif)
    const totalOrders = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { not: 'CANCELLED' }
      }
    });

    // Nouveaux clients (ce mois)
    const newCustomers = await prisma.customer.count({
      where: {
        companyId,
        createdAt: { gte: startOfMonth(new Date()) }
      }
    });

    // Alertes stock critiques (stock <= 0)
    const criticalStock = await prisma.product.count({
      where: {
        companyId,
        isActive: true,
        OR: [
          { stockQuantity: { lte: 0 } },
          { 
            AND: [
              { minStock: { gt: 0 } },
              { stockQuantity: { lte: prisma.product.fields.minStock } }
            ]
          }
        ]
      }
    });

    // Calcul du score de santé (Health Score)
    const totalCosts = await this.getTotalCosts(companyId);
    const revValue = Number(revenue._sum.totalAmountTtc || 0);
    const profitability = revValue > 0 ? ((revValue - totalCosts) / revValue) * 100 : 0;
    
    // Score de base 100, on retire des points pour les problèmes
    let score = 100;
    if (profitability < 15) score -= 20; // Basse rentabilité
    if (criticalStock > 5) score -= 15; // Trop de ruptures
    if (totalOrders === 0) score -= 30; // Pas d'activité

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
    // BC Ouverts
    const openOrders = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { in: ['DRAFT', 'CONFIRMED', 'VALIDATED', 'PREPARING'] }
      }
    });

    // CA Engagé
    const committedRevenue = await prisma.salesOrder.aggregate({
      where: {
        companyId,
        status: { in: ['DRAFT', 'CONFIRMED', 'VALIDATED', 'PREPARING'] }
      },
      _sum: { totalAmountTtc: true }
    });

    // Bons de commande client
    const totalSalesOrders = await prisma.salesOrder.count({
      where: {
        companyId,
        status: { not: 'CANCELLED' }
      }
    });

    // Alertes stock
    const stockAlerts = await prisma.product.count({
      where: {
        companyId,
        OR: [
          { stockQuantity: { lte: 0 } },
          { 
            AND: [
              { minStock: { gt: 0 } },
              { stockQuantity: { lte: prisma.product.fields.minStock } }
            ]
          }
        ]
      }
    });

    return {
      openOrders,
      committedRevenue: Number(committedRevenue._sum.totalAmountTtc || 0),
      totalSalesOrders,
      stockAlerts
    };
  }

  /**
   * Calcul des coûts totaux
   */
  private async getTotalCosts(companyId: string): Promise<number> {
    const [purchases, salaries, expenses] = await Promise.all([
      prisma.purchaseOrder.aggregate({
        where: { companyId, status: { not: 'CANCELLED' } },
        _sum: { totalTtc: true }
      }),
      prisma.payrollRun.aggregate({
        where: { companyId },
        _sum: { grossSalary: true }
      }),
      prisma.expense.aggregate({
        where: { companyId },
        _sum: { amount: true }
      })
    ]);

    return (
      Number(purchases._sum.totalTtc || 0) +
      Number(salaries._sum.grossSalary || 0) +
      Number(expenses._sum.amount || 0)
    );
  }

  /**
   * Calcul de variance en pourcentage
   */
  private calculateVariance(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
}

export const dashboardService = new DashboardService();
