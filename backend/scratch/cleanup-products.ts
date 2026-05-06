import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Product Cleanup Starting ---');
  
  // Use the enum values directly from ArticleType if possible, or as strings
  const internalTypes = ['RAW_MATERIAL', 'PACKAGING', 'CONSUMABLE'];
  
  console.log(`Targeting: ${internalTypes.join(', ')}`);

  const result = await prisma.product.updateMany({
    where: {
      articleType: {
        in: internalTypes as any
      }
    },
    data: {
      salePriceHt: 0,
      taxRate: 0
    }
  });

  console.log(`✅ Success: Updated ${result.count} internal products.`);
  console.log('Rules Applied: salePriceHt = 0, taxRate = 0');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
