import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { stockQuantity: true, reorderPoint: true }
    });
    const stockAlerts = products.filter(p => Number(p.stockQuantity) < Number(p.reorderPoint));
    const stockAlertsCount = stockAlerts.length;

    const totalCustomers = await prisma.customer.count({ where: { companyId } });
    const newCustomers = await prisma.customer.count({
      where: { companyId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });

    const latestCustomer = await prisma.customer.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        salesOrders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { totalAmountTtc: true, reference: true }
        }
      }
    });

    const latestCustomerData = latestCustomer ? {
      name: latestCustomer.name,
      createdAt: latestCustomer.createdAt,
      orderAmount: latestCustomer.salesOrders[0] ? Number(latestCustomer.salesOrders[0].totalAmountTtc) : 0,
      orderRef: latestCustomer.salesOrders[0] ? latestCustomer.salesOrders[0].reference : 'Aucune commande'
    } : null;

    const cashFlowKpi = await prisma.companyKpi.findUnique({
      where: { companyId_metric: { companyId, metric: 'cash_flow' } }
    });
    const revenueKpi = await prisma.companyKpi.findUnique({
      where: { companyId_metric: { companyId, metric: 'revenue' } }
    });
    const revenueMonthKpi = await prisma.companyKpi.findUnique({
      where: { companyId_metric: { companyId, metric: 'revenue_month' } }
    });
    const profitabilityKpi = await prisma.companyKpi.findUnique({
      where: { companyId_metric: { companyId, metric: 'profitability' } }
    });
    const recoveryKpi = await prisma.companyKpi.findUnique({
      where: { companyId_metric: { companyId, metric: 'recovery_rate' } }
    });

    const cashFlow = Number(cashFlowKpi?.value || 0);
    const revenue = Number(revenueKpi?.value || 0);
    const revenueMonth = Number(revenueMonthKpi?.value || 0);
    const profitability = Number(profitabilityKpi?.value || 0);
    const recoveryRate = Number(recoveryKpi?.value || 0);

    let score = 100;
    if (stockAlertsCount > 5) score -= 20;
    else if (stockAlertsCount > 0) score -= 10;
    if (cashFlow < 0) score -= 20;
    if (revenue === 0) score -= 10;
    if (profitability < 15) score -= 5;
    score = Math.max(0, Math.min(100, score));

    const stockStatus = stockAlertsCount > 3 ? 'critical' : stockAlertsCount > 0 ? 'warning' : 'good';
    const cashFlowStatus = cashFlow >= 0 ? 'good' : 'critical';
    const salesStatus = revenueMonth > 0 ? 'good' : 'warning';

    return NextResponse.json({
      success: true,
      data: {
        score,
        metrics: {
          cashFlow: {
            status: cashFlowStatus,
            pct: cashFlow >= 0 ? '+15.0%' : '-5.0%',
            label: 'vs mois dernier',
            tooltip: 'Tresorerie nette: Total encaissements moins total depenses'
          },
          stock: {
            status: stockStatus,
            pct: stockAlertsCount > 0 ? `-${Math.min(50, stockAlertsCount * 5)}.0%` : '+100.0%',
            label: stockAlertsCount > 0 ? `${stockAlertsCount} article(s) en alerte` : 'Niveau optimal',
            tooltip: `Articles en dessous du seuil de reapprovisionnement (${stockAlertsCount} alertes)`
          },
          sales: {
            status: salesStatus,
            pct: '+0.0%',
            label: 'CA ce mois',
            tooltip: 'Chiffre d affaires facture ce mois-ci'
          },
          hr: {
            status: 'warning',
            pct: '85.0%',
            label: 'capacite RH',
            tooltip: 'Taux d utilisation des ressources humaines disponibles'
          }
        },
        customers: { new: newCustomers, total: totalCustomers },
        latestCustomer: latestCustomerData
      }
    });
  } catch (error) {
    console.error('[DASHBOARD_HEALTH_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
