const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log('COMPANIES:', companies.map(c => ({ id: c.id, name: c.name })));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
