
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // 1. Get first company
    const company = await prisma.company.findFirst();
    if (!company) {
      console.error('No company found in database.');
      return;
    }
    console.log(`Testing with company: ${company.name} (${company.id})`);

    // 2. Create supplier
    const testSupplier = {
      companyId: company.id,
      name: `Test Supplier ${Date.now()}`,
      email: 'test@example.com',
      phone: '123456789',
      address: 'Test Address',
      nif: '0011223344',
      ai: '5566778899',
      rc: '9988776655',
      paymentTermsDays: 45,
      isActive: true,
    };

    console.log('Attempting to create supplier...');
    const created = await prisma.supplier.create({
      data: testSupplier,
    });

    console.log('SUCCESS: Supplier created!');
    console.log(JSON.stringify(created, null, 2));

    // 3. Cleanup (optional, but let's keep it to verify list works)
    console.log('Verifying list...');
    const list = await prisma.supplier.findMany({
      where: { companyId: company.id },
      take: 1,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${list.length} suppliers in latest list.`);

  } catch (error) {
    console.error('FAILED: Error during supplier creation test');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
