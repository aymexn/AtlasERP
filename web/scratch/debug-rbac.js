const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin2@test.com' },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User:', { id: user.id, email: user.email, role: user.role });
    console.log('UserRoles found:', user.roles.length);
    for (const ur of user.roles) {
      console.log(`- Role: name=${ur.role.name}, isActive=${ur.isActive}`);
      console.log(`  Permissions count:`, ur.role.permissions.length);
      const perms = ur.role.permissions.map(p => `${p.permission.module}:${p.permission.resource}:${p.permission.action}`);
      console.log(`  Permissions:`, perms.slice(0, 10), perms.length > 10 ? '...' : '');
    }

    const allRoles = await prisma.appRole.findMany();
    console.log('\nAll Roles in AppRole table:', allRoles.map(r => r.name));

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
