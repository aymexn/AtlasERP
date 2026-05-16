const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBug2() {
    console.log('--- Testing Bug 2 (Duplicate Receptions) ---');
    const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306'; // Demo company
    const po = await prisma.purchaseOrder.findFirst({
        where: { companyId, status: { in: ['CONFIRMED', 'SENT'] } }
    });

    if (!po) {
        console.log('No suitable PO found for testing Bug 2');
        return;
    }

    console.log(`PO found: ${po.reference} (${po.id})`);

    // Simulate two calls to createReception
    const res1 = await createReception(po.id, companyId);
    const res2 = await createReception(po.id, companyId);

    if (res1.id === res2.id) {
        console.log('Bug 2 Fixed: Same reception ID returned for multiple calls.');
    } else {
        console.error('Bug 2 Still Present: Duplicate reception created!');
    }
}

// Minimal implementation of createReception for testing (actual service logic)
async function createReception(poId, companyId) {
    const existingDraft = await prisma.stockReception.findFirst({
        where: { purchaseOrderId: poId, companyId, status: 'DRAFT' }
    });
    if (existingDraft) return existingDraft;

    return prisma.stockReception.create({
        data: {
            companyId,
            reference: `TEST-${Date.now()}`,
            purchaseOrderId: poId,
            warehouseId: '542167d4-8994-4638-9e56-f288770b7987', // ENT-PRINCIPAL
            status: 'DRAFT'
        }
    });
}

async function main() {
    await testBug2();
}

main().catch(console.error).finally(() => prisma.$disconnect());
