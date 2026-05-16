import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- ROBUST DATA LEAK CLEANUP ---');

    const LEAKED_IDS = [
        'ae144f97-26c9-4c6a-b1dc-e48834f18553',
        '543ca8dc-9abe-4081-b9fc-32f71a7480bb'
    ];

    for (const companyId of LEAKED_IDS) {
        console.log(`Processing company: ${companyId}`);
        
        // Delete in order to avoid FK issues
        await prisma.bOMComponent.deleteMany({
            where: { bom: { companyId } }
        });
        await prisma.billOfMaterials.deleteMany({ where: { companyId } });
        await prisma.stockMovement.deleteMany({ where: { companyId } });
        await prisma.productStock.deleteMany({ where: { companyId } });
        await prisma.manufacturingOrderLine.deleteMany({
            where: { manufacturingOrder: { companyId } }
        });
        await prisma.manufacturingOrder.deleteMany({ where: { companyId } });
        await prisma.salesOrderLine.deleteMany({
            where: { salesOrder: { companyId } }
        });
        await prisma.salesOrder.deleteMany({ where: { companyId } });
        await prisma.invoice.deleteMany({ where: { companyId } });
        await prisma.product.deleteMany({ where: { companyId } });
        
        console.log(`Cleaned up core models for ${companyId}`);
    }

    console.log('Cleanup complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
