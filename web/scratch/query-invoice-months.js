const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    select: { date: true, totalAmountTtc: true },
    orderBy: { date: 'asc' }
  });
  
  const months = {};
  invoices.forEach(inv => {
    const d = new Date(inv.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[m] = (months[m] || 0) + Number(inv.totalAmountTtc);
  });
  console.log('Invoice Months Distribution:', months);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
