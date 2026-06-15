import { seedRbac } from '../src/seed-rbac';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

seedRbac(prisma)
  .catch((e) => {
    console.error('Error running RBAC seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
