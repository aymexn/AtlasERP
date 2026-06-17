const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true }
  });
  console.log('COMPANIES:', companies);

  for (const c of companies) {
    console.log(`\n=== KPIS FOR ${c.name} (${c.id}) ===`);
    const kpis = await prisma.companyKpi.findMany({
      where: { companyId: c.id }
    });
    console.log(kpis.map(k => ({ metric: k.metric, value: k.value })));
    
    // Check if sales data exists
    const ordersCount = await prisma.salesOrder.count({
      where: { companyId: c.id }
    });
    console.log('Sales Orders Count:', ordersCount);
    
    const invoicesCount = await prisma.invoice.count({
      where: { companyId: c.id }
    });
    console.log('Invoices Count:', invoicesCount);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
