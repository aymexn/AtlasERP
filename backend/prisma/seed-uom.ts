import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('No company found. Please run seed-rbac first.');
    return;
  }

  const uoms = [
    { name: 'Kilogramme', symbol: 'KG', type: 'reference' },
    { name: 'Gramme', symbol: 'G', type: 'smaller' },
    { name: 'Litre', symbol: 'L', type: 'reference' },
    { name: 'Millilitre', symbol: 'ML', type: 'smaller' },
    { name: 'Pièce', symbol: 'PCS', type: 'reference' },
    { name: 'Palette', symbol: 'PLT', type: 'bigger' },
    { name: 'Fût 200L', symbol: 'DRUM200', type: 'bigger' },
    { name: 'Seau 20L', symbol: 'PAIL20', type: 'bigger' },
  ];

  for (const uom of uoms) {
    await prisma.unitOfMeasure.upsert({
      where: {
        companyId_symbol: {
          companyId: company.id,
          symbol: uom.symbol,
        },
      },
      update: {},
      create: {
        ...uom,
        companyId: company.id,
      },
    });
  }

  console.log('Seed Units of Measure completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
