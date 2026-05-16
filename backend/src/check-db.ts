import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({
        select: { id: true, name: true, slug: true }
    });
    console.log('COMPANIES:', JSON.stringify(companies, null, 2));

    const users = await prisma.user.findMany({
        select: { id: true, email: true, companyId: true, company: { select: { name: true } } }
    });
    console.log('USERS:', JSON.stringify(users, null, 2));

    // Check products per company
    for (const c of companies) {
        const count = await prisma.product.count({ where: { companyId: c.id } });
        console.log(`Company "${c.name}" (${c.id}): ${count} products`);
    }

    // Check for null companyId products
    const nullProducts = await prisma.$queryRawUnsafe('SELECT id, name, company_id FROM products WHERE company_id IS NULL');
    console.log('NULL COMPANY PRODUCTS:', JSON.stringify(nullProducts));
}

main().catch(console.error).finally(() => prisma.$disconnect());
