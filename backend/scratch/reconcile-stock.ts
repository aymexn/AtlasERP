import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const COMPANY_ID = '2f7a8615-a4af-4fd6-b637-cf69181db761'; // Atlas Peinture S.A.R.L
const PRODUCT_SKU = 'PF-PREP-VER-5L'; // Target SKU
const ALT_SKU = 'PF-DEC-VBS'; // Vernis Bois Déco Satin (Backup)

async function main() {
    console.log('🚀 Final attempt at reconciliation...');

    let product = await prisma.product.findUnique({
        where: { companyId_sku: { companyId: COMPANY_ID, sku: PRODUCT_SKU } }
    });

    if (!product) {
        console.warn(`⚠️ Target SKU ${PRODUCT_SKU} not found. Defaulting to ${ALT_SKU}.`);
        product = await prisma.product.findUnique({
            where: { companyId_sku: { companyId: COMPANY_ID, sku: ALT_SKU } }
        });
    }

    if (!product) {
        // Create the product if none found
        console.log('✨ Creating "Vernis Polyuréthane 5L" to ensure scenario completeness.');
        product = await prisma.product.create({
            data: {
                companyId: COMPANY_ID,
                sku: PRODUCT_SKU,
                name: 'Vernis Polyuréthane 5L',
                articleType: 'FINISHED_PRODUCT',
                unit: 'seau',
                salePriceHt: 4500,
                standardCost: 3000,
                taxRate: 0.19,
                stockQuantity: 0,
                trackStock: true
            }
        });
    }

    console.log(`📦 Working on: ${product.name} (${product.sku})`);
    
    // Inject History
    const startDate = new Date('2026-03-22');
    
    // Initial Stock Adjustment
    await prisma.stockMovement.create({
        data: {
            companyId: COMPANY_ID,
            productId: product.id,
            reference: 'SIM-INIT',
            type: 'ADJUSTMENT',
            quantity: 100,
            unit: product.unit,
            unitCost: product.standardCost,
            totalCost: 100 * Number(product.standardCost),
            reason: 'Ouverture de stock',
            date: startDate
        }
    });

    // Production In-flow (+300)
    for (let i = 1; i <= 3; i++) {
        await prisma.stockMovement.create({
            data: {
                companyId: COMPANY_ID,
                productId: product.id,
                reference: `SIM-PROD-00${i}`,
                type: 'IN',
                quantity: 100,
                unit: product.unit,
                unitCost: product.standardCost,
                totalCost: 100 * Number(product.standardCost),
                date: new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
            }
        });
    }

    // Sales Out-flow (-40)
    for (let i = 1; i <= 15; i++) {
        await prisma.stockMovement.create({
            data: {
                companyId: COMPANY_ID,
                productId: product.id,
                reference: `SIM-VENTE-00${i}`,
                type: 'OUT',
                quantity: i <= 10 ? 2 : 4, // 10*2 + 5*4 = 40
                unit: product.unit,
                unitCost: product.standardCost,
                totalCost: 2 * Number(product.standardCost),
                date: new Date(startDate.getTime() + i * 2 * 24 * 60 * 60 * 1000)
            }
        });
    }

    // Final Sync
    const allMovements = await prisma.stockMovement.findMany({ where: { productId: product.id } });
    const finalStock = allMovements.reduce((acc, m) => {
        const qty = Number(m.quantity);
        if (m.type === 'IN') return acc + qty;
        if (m.type === 'OUT') return acc - qty;
        if (m.type === 'ADJUSTMENT') return acc + qty;
        return acc;
    }, 0);

    await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: finalStock }
    });

    console.log(`✅ Success! Final stock for ${product.sku} is ${finalStock}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
