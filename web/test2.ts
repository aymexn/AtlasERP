import { prisma } from './src/lib/prisma';

async function debug() {
  const pos = await prisma.purchaseOrder.findMany({
    include: { lines: true }
  });
  console.log('Purchase Orders in DB:', JSON.stringify(pos, null, 2));

  const stocks = await prisma.productStock.findMany({
    include: { product: true }
  });
  console.log('Stocks in DB:', JSON.stringify(stocks, null, 2));
}

debug().catch(console.error).finally(() => prisma.$disconnect());
