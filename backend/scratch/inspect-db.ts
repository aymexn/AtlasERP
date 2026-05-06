import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Listing all products in the database...');
    const products = await prisma.product.findMany({
        take: 20,
        select: {
            sku: true,
            name: true,
            companyId: true
        }
    });
    
    console.table(products);

    const companies = await prisma.company.findMany({
        take: 5,
        select: {
            id: true,
            name: true,
            slug: true
        }
    });
    console.log('🏢 Companies:');
    console.table(companies);
}

main().catch(console.error).finally(() => prisma.$disconnect());
