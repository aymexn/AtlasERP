const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const salesOrders = await prisma.salesOrder.findMany({
    where: { companyId },
    select: { id: true, reference: true, date: true, totalAmountTtc: true, status: true },
    orderBy: { date: 'desc' }
  });
  console.log('TOTAL SALES ORDERS:', salesOrders.length);
  console.log('LATEST 10 ORDERS:');
  console.log(salesOrders.slice(0, 10));

  // Let's count how many are in June 2026
  const juneOrders = salesOrders.filter(so => {
    const d = new Date(so.date);
    return d.getFullYear() === 2026 && d.getMonth() === 5; // June is index 5
  });
  console.log('JUNE 2026 ORDERS COUNT:', juneOrders.length);
  const sumjune = juneOrders.reduce((sum, so) => sum + Number(so.totalAmountTtc), 0);
  console.log('JUNE 2026 ORDERS SUM:', sumjune);
  
  // Also check invoices
  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    select: { id: true, status: true, totalAmountTtc: true, amountPaid: true, date: true }
  });
  console.log('TOTAL INVOICES:', invoices.length);
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'PAID');
  console.log('UNPAID INVOICES COUNT:', unpaidInvoices.length);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
