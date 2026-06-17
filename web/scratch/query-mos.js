const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const mos = await prisma.manufacturingOrder.findMany({
    where: { companyId },
    select: { id: true, reference: true, status: true, totalActualCost: true }
  });
  console.log('MANUFACTURING ORDERS:', mos);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
