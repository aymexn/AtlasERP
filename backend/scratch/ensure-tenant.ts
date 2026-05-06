import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const COMPANY_ID = '543ca8dc-9abe-4081-b9fc-32f71a7480bb';
const USER_EMAIL = 'aymenderouiche001@gmail.com';

async function main() {
  // We check if company exists. If not, we create it.
  // The screenshot shows a user with this companyId already exists.
  const company = await prisma.company.findUnique({
    where: { id: COMPANY_ID }
  });

  if (!company) {
    console.log('Company missing. Creating...');
    await prisma.company.create({
      data: {
        id: COMPANY_ID,
        name: "aymenCO's Company",
        slug: 'aymenco-2' // Unique slug
      }
    });
  } else {
    console.log('Company exists.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
