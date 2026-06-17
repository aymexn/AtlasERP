const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    select: { id: true, reference: true, date: true, totalAmountTtc: true, status: true },
    orderBy: { date: 'desc' }
  });
  console.log('TOTAL INVOICES:', invoices.length);
  
  const juneInvoices = invoices.filter(inv => {
    const d = new Date(inv.date);
    return d.getFullYear() === 2026 && d.getMonth() === 5; // June
  });
  console.log('JUNE 2026 INVOICES COUNT:', juneInvoices.length);
  console.log('JUNE 2026 INVOICES:', juneInvoices);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
