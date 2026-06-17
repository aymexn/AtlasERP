import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== ROLES ===");
  const roles = await prisma.appRole.findMany();
  console.log(JSON.stringify(roles, null, 2));

  console.log("\n=== USER ROLES ===");
  const userRoles = await prisma.userRole.findMany({
    include: {
      user: { select: { email: true } },
      role: { select: { name: true } }
    }
  });
  console.log(JSON.stringify(userRoles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
