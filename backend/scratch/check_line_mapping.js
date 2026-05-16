const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reception = await prisma.stockReception.findFirst({
    where: { reference: 'REC-202605-0001' },
    include: {
      lines: true
    }
  });
  
  if (!reception) {
    console.log('Reception not found');
    return;
  }

  console.log('Reception Lines:');
  reception.lines.forEach(line => {
    console.log(`- ID: ${line.id}, Product: ${line.productId}, PurchaseLine: ${line.purchaseLineId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
