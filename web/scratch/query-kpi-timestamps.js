const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const kpis = await prisma.companyKpi.findMany({
    where: { companyId },
    select: { metric: true, value: true, updatedAt: true }
  });
  console.log('KPIS AND TIMESTAMPS:');
  console.log(kpis);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
