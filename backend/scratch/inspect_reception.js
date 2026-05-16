const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reception = await prisma.stockReception.findFirst({
    where: { reference: 'REC-202605-0001' },
    include: {
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!reception) {
    console.log('Reception not found');
    return;
  }

  console.log('Reception Details:');
  console.log(`Reference: ${reception.reference}`);
  console.log(`Status: ${reception.status}`);
  
  reception.lines.forEach(line => {
    console.log(`- Product: ${line.product.name} (${line.product.sku})`);
    console.log(`  Received Qty: ${line.receivedQty}`);
    console.log(`  Expected Qty: ${line.expectedQty}`);
    console.log(`  Unit: ${line.product.unit}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
