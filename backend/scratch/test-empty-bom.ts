import { PrismaClient, ManufacturingOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();
const COMPANY_ID = '543ca8dc-9abe-4081-b9fc-32f71a7480bb';

async function testEmptyBOM() {
    console.log('🧪 Testing Empty BOM Completion...');

    // 1. Create a product with NO formulation
    const product = await prisma.product.create({
        data: {
            name: 'Test Product No BOM',
            sku: 'TEST-NO-BOM',
            articleType: 'FINISHED_PRODUCT',
            unit: 'PCS',
            companyId: COMPANY_ID,
            trackStock: true
        }
    });

    // 2. Create a MO for it
    const mo = await prisma.manufacturingOrder.create({
        data: {
            reference: 'MO-TEST-EMPTY',
            productId: product.id,
            plannedQuantity: 10,
            unit: 'PCS',
            status: 'IN_PROGRESS',
            companyId: COMPANY_ID,
            plannedDate: new Date()
        }
    });

    console.log(`Created MO ${mo.id} for product ${product.id}`);

    // 3. Try manual simulation of completion logic
    try {
        console.log('Starting transaction simulation...');
        await prisma.$transaction(async (tx) => {
            const moFull = await tx.manufacturingOrder.findUnique({
                where: { id: mo.id },
                include: { lines: true }
            });

            console.log(`MO Lines count: ${moFull?.lines.length}`);
            
            let totalCost = 0;
            // Loop over empty lines
            for (const line of moFull!.lines) {
                totalCost += 10; // should stay 0
            }

            const producedQty = Number(moFull!.plannedQuantity);
            const unitCost = producedQty > 0 ? totalCost / producedQty : 0;
            
            console.log(`Calculation Success: Unit Cost = ${unitCost}`);
        });
        console.log('✅ Empty BOM completion simulation passed.');
    } catch (e) {
        console.error('❌ Empty BOM completion simulation failed:', e);
    } finally {
        // Cleanup
        await prisma.manufacturingOrder.delete({ where: { id: mo.id } });
        await prisma.product.delete({ where: { id: product.id } });
    }
}

testEmptyBOM().catch(console.error).finally(() => prisma.$disconnect());
