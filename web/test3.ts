import { prisma } from './src/lib/prisma';

async function debug() {
  const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306';
  const stockAlerts = await prisma.product.count({
      where: {
        companyId,
        isActive: true,
        OR: [
          { stockQuantity: { lte: 0 } },
          { 
            AND: [
              { minStock: { gt: 0 } },
              { stockQuantity: { lte: prisma.product.fields.minStock } }
            ]
          }
        ]
      }
    });
  console.log('Stock Alerts:', stockAlerts);
}

debug().catch(console.error).finally(() => prisma.$disconnect());
