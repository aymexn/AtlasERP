const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Article Type Normalization ---');
    
    const mp004 = await prisma.$executeRaw`UPDATE products SET article_type = 'RAW_MATERIAL' WHERE sku = 'MP004' AND article_type = 'FINISHED_PRODUCT'`;
    console.log(`MP004 updated: ${mp004} rows`);

    const emb = await prisma.$executeRaw`UPDATE products SET article_type = 'PACKAGING' WHERE sku IN ('EMB01', 'EMB02') AND article_type = 'RAW_MATERIAL'`;
    console.log(`EMB updated: ${emb} rows`);

    const results = await prisma.product.findMany({
        where: { sku: { in: ['MP004', 'EMB01', 'EMB02'] } },
        select: { sku: true, articleType: true }
    });
    console.log('Verification:', results);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
