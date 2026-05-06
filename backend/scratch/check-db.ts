import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    const productsCount = await prisma.product.count();
    console.log(`Total products: ${productsCount}`);
    
    // Check if analytics tables exist
    try {
      const abcCount = await prisma.abcClassification.count();
      console.log(`ABC classifications: ${abcCount}`);
    } catch (e) {
      console.error('ABC table missing or inaccessible');
    }
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
