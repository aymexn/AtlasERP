import { prisma } from '../src/lib/prisma';

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9'; // Cameleon Colors

  const boms = await prisma.billOfMaterials.findMany({
    where: { companyId },
    include: { product: true }
  });
  console.log('BOMs in DB:', boms.map(b => ({
    id: b.id,
    name: b.name,
    productName: b.product?.name,
    productId: b.productId
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
