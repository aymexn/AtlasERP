import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting products sale price cleanup...');
    
    // Set salePriceHt = null for any product where type !== 'FINISHED_GOOD'
    const result = await prisma.product.updateMany({
        where: {
            type: {
                not: 'FINISHED_GOOD'
            },
            salePriceHt: {
                not: null
            }
        },
        data: {
            salePriceHt: null
        }
    });

    console.log(`✅ Cleanup complete! Reset salePriceHt to NULL for ${result.count} non-finished products.`);
}

main()
  .catch(err => {
      console.error('💥 Fatal error during cleanup:', err);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });
