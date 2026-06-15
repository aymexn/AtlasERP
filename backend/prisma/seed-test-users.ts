import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RBAC Test Users...');

  // 1. Find or create the company "Société Test RBAC"
  let company = await prisma.company.findFirst({
    where: { name: 'Société Test RBAC' }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Société Test RBAC',
        slug: 'societe-test-rbac',
        email: 'info@rbac-test.local',
        phone: '0555 12 34 56',
        address: '45, Rue de la Paix, Alger',
      }
    });
    console.log(`Created company: ${company.name} (${company.id})`);
  } else {
    console.log(`Found existing company: ${company.name} (${company.id})`);
  }

  const companyId = company.id;

  // 2. Clean existing users under this company to make the seed repeatable
  const deletedUsers = await prisma.user.deleteMany({
    where: { companyId }
  });
  console.log(`Deleted ${deletedUsers.count} existing test users.`);

  const passwordHash = await bcrypt.hash('Test@1234', 10);

  // 3. Define the users
  const userDefs = [
    { email: 'admin@rbac-test.local', name: 'Admin Test', enumRole: Role.ADMIN, appRoleName: 'admin' },
    { email: 'manager@rbac-test.local', name: 'Manager Test', enumRole: Role.MANAGER, appRoleName: 'manager' },
    { email: 'commercial@rbac-test.local', name: 'Commercial Test', enumRole: Role.COMMERCIAL, appRoleName: 'commercial' },
    { email: 'hr@rbac-test.local', name: 'HR Test', enumRole: Role.EMPLOYEE, appRoleName: 'hr_manager' },
  ];

  // 4. Create users and link their AppRole
  for (const def of userDefs) {
    const user = await prisma.user.create({
      data: {
        email: def.email,
        name: def.name,
        passwordHash,
        role: def.enumRole,
        companyId,
        status: UserStatus.ACTIVE,
      }
    });
    console.log(`Created user: ${user.email}`);

    // Find the AppRole by name
    const appRole = await prisma.appRole.findUnique({
      where: { name: def.appRoleName }
    });

    if (!appRole) {
      console.warn(`Warning: AppRole '${def.appRoleName}' not found in database! Make sure to seed RBAC first.`);
      continue;
    }

    // Link the user to the AppRole
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: appRole.id,
        isActive: true,
      }
    });
    console.log(`Assigned AppRole '${def.appRoleName}' to user ${user.email}`);
  }

  console.log('✅ RBAC Test Users Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
