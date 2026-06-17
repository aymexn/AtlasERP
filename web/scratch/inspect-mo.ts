import { prisma } from '../src/lib/prisma';

async function main() {
  const company = await prisma.company.findFirst({ where: { name: 'Cameleon Colors' } });
  if (!company) {
    console.log('Company not found');
    return;
  }
  const companyId = company.id;
  
  const stats = await prisma.$queryRaw`
      SELECT status, COUNT(*)::int as count 
      FROM manufacturing_orders 
      WHERE company_id = ${companyId}::uuid
      GROUP BY status
  `;
  console.log('RAW STATS:', stats);

  const statuses = await prisma.$queryRaw`
      SELECT DISTINCT status FROM manufacturing_orders
  `;
  console.log('DISTINCT STATUSES:', statuses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
