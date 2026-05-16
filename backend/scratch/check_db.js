const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, unit: true }
  });
  console.log('--- PRODUCTS ---');
  console.table(products);

  const receptions = await prisma.stockReception.findMany({
    where: { reference: 'REC-202605-0001' },
    include: {
      lines: {
        include: {
          product: {
            select: { sku: true, name: true, unit: true }
          }
        }
      }
    }
  });
  
  if (receptions.length > 0) {
    console.log('\n--- RECEPTION REC-202605-0001 ---');
    console.log('Status:', receptions[0].status);
    console.log('Lines:');
    console.table(receptions[0].lines.map(l => ({
      sku: l.product.sku,
      name: l.product.name,
      ordered_unit: l.unit,
      product_unit: l.product.unit,
      expected: l.expectedQty,
      received: l.receivedQty
    })));
  } else {
    console.log('\n--- RECEPTION REC-202605-0001 NOT FOUND ---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
