const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBug3() {
    console.log('--- Testing Bug 3 (Product Search) ---');
    const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306';
    
    // Test search by SKU
    const skuSearch = 'VE1L';
    const resultsSku = await prisma.product.findMany({
        where: {
            companyId,
            OR: [
                { name: { contains: skuSearch } },
                { sku: { contains: skuSearch } }
            ]
        }
    });
    console.log(`Search for SKU "${skuSearch}": ${resultsSku.length} results found.`);
    if (resultsSku.length > 0) console.log(`Result 1: ${resultsSku[0].name} (${resultsSku[0].sku})`);

    // Test search by Name (partial)
    const nameSearch = 'Vernis';
    const resultsName = await prisma.product.findMany({
        where: {
            companyId,
            OR: [
                { name: { contains: nameSearch } },
                { sku: { contains: nameSearch } }
            ]
        }
    });
    console.log(`Search for name "${nameSearch}": ${resultsName.length} results found.`);
}

async function main() {
    await testBug3();
}

main().catch(console.error).finally(() => prisma.$disconnect());
