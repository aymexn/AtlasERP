const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  console.log('Fetching AI Context data...');

  const now = new Date();
  // June 2026 for Cameleon Colors
  const currentMonthStart = new Date('2026-06-01');
  const currentMonthEnd = new Date('2026-06-30T23:59:59');
  const lastMonthStart = new Date('2026-05-01');
  const lastMonthEnd = new Date('2026-05-31T23:59:59');

  const [
    paymentsSum,
    expensesSum,
    companySettings,
    currentMonthSales,
    lastMonthSales,
    unpaidInvoices,
    stockAlerts,
    topClientsRaw,
    recentPayments,
    recentExpenses,
    openMOs,
    pendingPOs
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { companyId },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { companyId },
      _sum: { amount: true }
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true }
    }),
    prisma.salesOrder.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, date: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { totalAmountTtc: true }
    }),
    prisma.salesOrder.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { totalAmountTtc: true }
    }),
    prisma.invoice.findMany({
      where: { companyId, status: { not: 'PAID' } },
      select: { id: true, totalAmountTtc: true, amountRemaining: true }
    }),
    prisma.product.findMany({
      where: { companyId, isActive: true, stockQuantity: { lt: prisma.product.fields.reorderPoint } },
      select: { name: true, sku: true, stockQuantity: true, reorderPoint: true }
    }),
    prisma.salesOrder.groupBy({
      by: ['customerId'],
      where: { companyId, status: { not: 'CANCELLED' } },
      _sum: { totalAmountTtc: true },
      orderBy: { _sum: { totalAmountTtc: 'desc' } },
      take: 5
    }),
    prisma.payment.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { invoice: { select: { reference: true } } }
    }),
    prisma.expense.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 5
    }),
    prisma.manufacturingOrder.count({
      where: { companyId, status: { in: ['PLANNED', 'IN_PROGRESS'] } }
    }),
    prisma.purchaseOrder.count({
      where: { companyId, status: { in: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'] } }
    })
  ]);

  const treasury = Number(paymentsSum._sum.amount || 0) - Number(expensesSum._sum.amount || 0);
  const target = Number(companySettings?.settings?.monthly_revenue_target ?? 1000000);
  const curMonthCA = Number(currentMonthSales._sum.totalAmountTtc || 0);
  const lastMonthCA = Number(lastMonthSales._sum.totalAmountTtc || 0);

  const unpaidCount = unpaidInvoices.length;
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amountRemaining), 0);

  // Fetch client names for top clients
  const clientIds = topClientsRaw.map(c => c.customerId);
  const clients = await prisma.customer.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true }
  });
  const topClients = topClientsRaw.map(c => ({
    name: clients.find(cl => cl.id === c.customerId)?.name || 'Inconnu',
    revenue: Number(c._sum.totalAmountTtc)
  }));

  // Combine payments and expenses for last 10 transactions
  const transactions = [
    ...recentPayments.map(p => ({
      date: p.date,
      type: 'payment_received',
      amount: Number(p.amount),
      description: `Encaissement facture ${p.invoice?.reference || ''}`
    })),
    ...recentExpenses.map(e => ({
      date: e.date,
      type: 'expense_paid',
      amount: Number(e.amount),
      description: e.description || e.category || 'Dépense'
    }))
  ];
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log('RESULTS:');
  console.log({
    treasury,
    target,
    curMonthCA,
    lastMonthCA,
    unpaidCount,
    unpaidTotal,
    stockAlertsCount: stockAlerts.length,
    topClients,
    transactionsCount: transactions.length,
    openMOs,
    pendingPOs
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
