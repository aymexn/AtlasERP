import { prisma } from './src/lib/prisma';
async function debug() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const latestClassification = await prisma.abcClassification.findFirst({
    where: { companyId },
    orderBy: { classifiedAt: 'desc' },
    select: { classifiedAt: true }
  });

  if (!latestClassification) {
    console.log('No latest classification found');
    return;
  }

  console.log('Latest classifiedAt:', latestClassification.classifiedAt);

  const classes = ['A', 'B', 'C'];
  for (const cls of classes) {
    const count = await prisma.abcClassification.count({
      where: {
        companyId,
        classification: cls,
        classifiedAt: latestClassification.classifiedAt
      }
    });
    console.log(`Class ${cls} count:`, count);
    if (count > 0) {
      const sample = await prisma.abcClassification.findFirst({
        where: { companyId, classification: cls, classifiedAt: latestClassification.classifiedAt },
        include: { product: true }
      });
      console.log(`  Sample:`, sample?.product?.name, 'Revenue:', sample?.annualRevenue?.toString());
    }
  }
}
debug().catch(console.error).finally(() => prisma.$disconnect());
