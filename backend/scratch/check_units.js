const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      sku: { in: ['MP001', 'MP002', 'MP003', 'MP004', 'EMB01', 'EMB02'] }
    },
    select: {
      sku: true,
      name: true,
      unit: true
    }
  });
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
