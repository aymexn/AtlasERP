const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const classification = 'A';
  try {
    const latestClassification = await prisma.abcClassification.findFirst({
      where: { companyId },
      orderBy: { classifiedAt: 'desc' },
      select: { classifiedAt: true }
    });

    console.log('Latest classification date:', latestClassification?.classifiedAt);

    if (latestClassification) {
      const products = await prisma.abcClassification.findMany({
        where: {
          companyId,
          classification,
          classifiedAt: latestClassification.classifiedAt
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              family: { select: { name: true } }
            }
          }
        },
        orderBy: { revenuePercentage: 'desc' }
      });
      console.log('Found products for Class A:', products.length);
      if (products.length > 0) {
        console.log('Sample product:', products[0]);
      }
    }
  } catch (error) {
    console.error('Error querying products:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
