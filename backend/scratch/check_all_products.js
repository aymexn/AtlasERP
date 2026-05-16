const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { company: true }
  });
  console.log('--- ALL PRODUCTS ---');
  console.table(products.map(p => ({
    company: p.company.name,
    sku: p.sku,
    name: p.name,
    unit: p.unit
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
