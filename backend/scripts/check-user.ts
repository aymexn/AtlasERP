import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database User Check ---');
  
  // 1. Fetch all users
  const users = await prisma.user.findMany({
    include: {
      company: true,
    }
  });

  console.log(`Found ${users.length} users in the database:`);
  users.forEach(u => {
    console.log(`- ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Company ID: ${u.companyId} (${u.company?.name || 'N/A'})`);
    console.log(`  Has Password Hash: ${!!u.passwordHash}`);
    console.log('------------------------------------');
  });

  // 2. Check if aymenderouiche001@gmail.com exists
  const targetEmail = 'aymenderouiche001@gmail.com';
  const targetUser = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());

  if (targetUser) {
    console.log(`User ${targetEmail} exists!`);
    // Hash the desired password "18032004"
    const newPassword = '18032004';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update the password in database
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash }
    });
    
    console.log(`Successfully updated password for ${targetEmail} to hash of "${newPassword}".`);
  } else {
    console.log(`User ${targetEmail} does NOT exist in the database!`);
    
    // Let's check if there is an existing company we can associate the new user with,
    // or if we should create a new company.
    const companies = await prisma.company.findMany();
    if (companies.length > 0) {
      const company = companies[0];
      const newPassword = '18032004';
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash,
          companyId: company.id,
          role: 'ADMIN',
        }
      });
      console.log(`Created user ${targetEmail} under company "${company.name}" (ID: ${company.id}) with password "${newPassword}".`);
    } else {
      console.log('No companies found. Cannot create user without a company.');
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
