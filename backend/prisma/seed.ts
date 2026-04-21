import { PrismaClient, SalesOrderStatus, PurchaseOrderStatus, ManufacturingOrderStatus, InvoiceStatus, PaymentMethod, ArticleType, FormulaStatus, MovementType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// ====================================
// CONFIGURATION
// ====================================
const TARGET_COMPANY_ID = '61324390-5b8f-488f-a287-285fb37a5ead'; // aymenCO's company ID
const SIMULATION_START = new Date('2026-03-22');
const SIMULATION_END = new Date('2026-04-21');

// Helper: Random date in range
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper: Random int
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Random choice
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

async function main() {
    console.log('🎨 Starting AtlasERP Industrial Hypergrowth Simulation...');
    console.log(`📅 Period: ${SIMULATION_START.toLocaleDateString()} → ${SIMULATION_END.toLocaleDateString()}`);

    // Verify Company
    const company = await prisma.company.findUnique({
        where: { id: TARGET_COMPANY_ID }
    });

    if (!company) {
        throw new Error(`Company with ID ${TARGET_COMPANY_ID} not found!`);
    }

    console.log(`✅ Company found: ${company.name}`);

    // ====================================
    // CLEANUP - Clear existing data for this company to avoid SKU conflicts and pollution
    // ====================================
    console.log('🧹 Cleaning up existing data for this company...');
    const cid = TARGET_COMPANY_ID;
    await prisma.stockMovement.deleteMany({ where: { companyId: cid } });
    await prisma.payment.deleteMany({ where: { companyId: cid } });
    await prisma.invoice.deleteMany({ where: { companyId: cid } });
    await prisma.salesOrderLine.deleteMany({ where: { salesOrder: { companyId: cid } } });
    await prisma.salesOrder.deleteMany({ where: { companyId: cid } });
    await prisma.manufacturingOrderLine.deleteMany({ where: { manufacturingOrder: { companyId: cid } } });
    await prisma.manufacturingOrder.deleteMany({ where: { companyId: cid } });
    await prisma.productFormulaLine.deleteMany({ where: { formula: { companyId: cid } } });
    await prisma.productFormula.deleteMany({ where: { companyId: cid } });
    await prisma.stockReceptionLine.deleteMany({ where: { reception: { companyId: cid } } });
    await prisma.stockReception.deleteMany({ where: { companyId: cid } });
    await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrder: { companyId: cid } } });
    await prisma.purchaseOrder.deleteMany({ where: { companyId: cid } });
    await prisma.productStock.deleteMany({ where: { companyId: cid } });
    await prisma.product.deleteMany({ where: { companyId: cid } });
    await prisma.productFamily.deleteMany({ where: { companyId: cid } });
    await prisma.customer.deleteMany({ where: { companyId: cid } });
    await prisma.supplier.deleteMany({ where: { companyId: cid } });
    await prisma.expense.deleteMany({ where: { companyId: cid } });
    await prisma.warehouse.deleteMany({ where: { companyId: cid } });

    // ====================================
    // WAREHOUSE
    // ====================================
    const warehouse = await prisma.warehouse.create({
        data: {
            companyId: cid,
            name: 'Entrepôt Principal Atlas',
            code: 'WAR-01',
            location: 'Zone Industrielle Batna'
        }
    });

    // ====================================
    // 1. PRODUCT FAMILIES
    // ====================================
    console.log('📦 Creating Product Families...');
    const families = [
        { name: 'Matières Premières', code: 'MP', color: '#8B5CF6' },
        { name: 'Atlas Pro - Peintures Décoratives', code: 'ATLAS-PRO', color: '#3B82F6' },
        { name: 'Industrie - Revêtements Techniques', code: 'IND', color: '#EF4444' },
        { name: 'Préparation & Finition', code: 'PREP', color: '#10B981' },
        { name: 'Emballages', code: 'EMB', color: '#F59E0B' }
    ];

    const createdFamilies: any = {};
    for (const f of families) {
        const family = await prisma.productFamily.create({
            data: {
                companyId: cid,
                name: f.name,
                code: f.code,
                colorBadge: f.color,
                sortOrder: families.indexOf(f)
            }
        });
        createdFamilies[f.code] = family;
    }

    // ====================================
    // 2. PRODUCTS (18 RAW + 10 FINISHED)
    // ====================================
    console.log('🧪 Creating Products...');
    
    // Raw Materials data
    const rawData = [
        { name: 'Résine Acrylique Base Eau', sku: 'MP-RES-ACR-001', price: 2450, family: 'MP' },
        { name: 'Résine Époxy Bi-composant', sku: 'MP-RES-EPO-002', price: 4200, family: 'MP' },
        { name: 'Résine Alkyde Glycérophtalique', sku: 'MP-RES-ALK-003', price: 3150, family: 'MP' },
        { name: 'Pigment Rouge Oxyde de Fer', sku: 'MP-PIG-ROU-004', price: 1850, family: 'MP' },
        { name: 'Pigment Bleu Phtalocyanine', sku: 'MP-PIG-BLE-005', price: 2100, family: 'MP' },
        { name: 'Pigment Jaune Oxyde de Chrome', sku: 'MP-PIG-JAU-006', price: 1950, family: 'MP' },
        { name: 'Pigment Noir Carbone', sku: 'MP-PIG-NOI-007', price: 1650, family: 'MP' },
        { name: 'Solvant Universel Dégraissant', sku: 'MP-SOL-UNI-008', price: 980, family: 'MP' },
        { name: 'Durcisseur Époxy Amine', sku: 'MP-DUR-EPO-009', price: 3500, family: 'MP' },
        { name: 'Additif Anti-UV Protection Solaire', sku: 'MP-ADD-UV-010', price: 2200, family: 'MP' },
        { name: 'Additif Anti-Moisissure Fongicide', sku: 'MP-ADD-MOI-011', price: 1750, family: 'MP' },
        { name: 'Charges Carbonate de Calcium', sku: 'MP-CHA-CAR-012', price: 450, family: 'MP' },
        { name: 'Liant Polyuréthane Haute Performance', sku: 'MP-LIA-POL-013', price: 3800, family: 'MP' },
        { name: 'Épaississant Cellulosique', sku: 'MP-EPA-CEL-014', price: 1250, family: 'MP' },
        { name: 'Dispersant Polymérique Wetting Agent', sku: 'MP-DIS-POL-015', price: 2850, family: 'MP' },
        { name: 'Seau Plastique 5L', sku: 'EMB-SEA-5L-016', price: 120, family: 'EMB', type: 'PACKAGING' },
        { name: 'Seau Plastique 10L', sku: 'EMB-SEA-10L-017', price: 180, family: 'EMB', type: 'PACKAGING' },
        { name: 'Seau Métallique 20L', sku: 'EMB-SEA-20L-018', price: 320, family: 'EMB', type: 'PACKAGING' }
    ];

    const productsMP = [];
    for (const d of rawData) {
        const p = await prisma.product.create({
            data: {
                companyId: cid,
                name: d.name,
                sku: d.sku,
                articleType: (d.type || 'RAW_MATERIAL') as ArticleType,
                purchasePriceHt: d.price,
                standardCost: d.price,
                salePriceHt: d.price * 1.5,
                familyId: createdFamilies[d.family].id,
                stockQuantity: 1000,
                trackStock: true,
                unit: d.family === 'EMB' ? 'pcs' : 'kg'
            }
        });
        productsMP.push(p);
    }

    // Finished Goods data
    const pfData = [
        { name: 'Atlas Pro Mat 5L', sku: 'PF-ATLAS-MAT-5L', sale: 4200, cost: 2800, family: 'ATLAS-PRO' },
        { name: 'Atlas Pro Satin 5L', sku: 'PF-ATLAS-SAT-5L', sale: 4650, cost: 3100, family: 'ATLAS-PRO' },
        { name: 'Atlas Pro Brillant 5L', sku: 'PF-ATLAS-BRI-5L', sale: 5400, cost: 3600, family: 'ATLAS-PRO' },
        { name: 'Atlas Pro Façade 10L', sku: 'PF-ATLAS-FAC-10L', sale: 7800, cost: 5200, family: 'ATLAS-PRO' },
        { name: 'Anticorrosion Industriel 20L', sku: 'PF-IND-ANTI-20L', sale: 9200, cost: 6100, family: 'IND' },
        { name: 'Époxy Sol Trafic 20L', sku: 'PF-IND-EPO-TRA-20L', sale: 9850, cost: 6500, family: 'IND' },
        { name: 'Époxy Cristal Clear 10L', sku: 'PF-IND-EPO-CRI-10L', sale: 8500, cost: 5600, family: 'IND' },
        { name: 'Enduit de Rebouchage 5L', sku: 'PF-PREP-END-5L', sale: 2800, cost: 1800, family: 'PREP' },
        { name: 'Apprêt Universel 10L', sku: 'PF-PREP-APP-10L', sale: 3950, cost: 2600, family: 'PREP' },
        { name: 'Vernis Polyuréthane 5L', sku: 'PF-PREP-VER-5L', sale: 4500, cost: 3000, family: 'PREP' }
    ];

    const productsPF = [];
    for (const d of pfData) {
        const p = await prisma.product.create({
            data: {
                companyId: cid,
                name: d.name,
                sku: d.sku,
                articleType: 'FINISHED_PRODUCT',
                purchasePriceHt: d.cost,
                standardCost: d.cost,
                salePriceHt: d.sale,
                familyId: createdFamilies[d.family].id,
                stockQuantity: 200,
                trackStock: true,
                unit: d.sku.includes('L') ? 'bucket' : 'pcs'
            }
        });
        productsPF.push(p);

        // FORMULA for each PF
        await prisma.productFormula.create({
            data: {
                companyId: cid,
                productId: p.id,
                name: `Formule ${p.name}`,
                status: 'ACTIVE',
                outputQuantity: 1,
                outputUnit: p.unit,
                lines: {
                    create: [
                        { componentProductId: productsMP[0].id, quantity: 0.5, unit: 'kg' },
                        { componentProductId: productsMP[15].id, quantity: 1, unit: 'pcs' }
                    ]
                }
            }
        });
    }

    // ====================================
    // 3. SUPPLIERS (5)
    // ====================================
    console.log('🏭 Creating Suppliers...');
    const supplierNames = ['BASF Chemicals Algeria', 'DOW Algérie Distribution', 'Emballages du Chelif', 'Colorants de l\'Est', 'Transport Logistique Express'];
    const suppliers = [];
    for (const name of supplierNames) {
        const s = await prisma.supplier.create({
            data: {
                companyId: cid,
                name,
                code: `SUP-${supplierNames.indexOf(name) + 1}`,
                city: randomChoice(['Alger', 'Oran', 'Batna', 'Sétif']),
                isActive: true
            }
        });
        suppliers.push(s);
    }

    // ====================================
    // 4. CUSTOMERS (10)
    // ====================================
    console.log('👥 Creating Customers...');
    const custData = [
        { name: 'Promotion Immobilière Al-Ameen', credit: 15000000 },
        { name: 'Ets Bouaziz Peinture Grossiste', credit: 8000000 },
        { name: 'SARL Peintre Pro Constantine', credit: 5000000 },
        { name: 'Quincaillerie Atlas Moderne', credit: 6000000 },
        { name: 'Entreprise Générale du Bâtiment', credit: 12000000 },
        { name: 'Décor Luxe Intérieur', credit: 4000000 },
        { name: 'Hôtel Meridien Oran', credit: 10000000 },
        { name: 'Université Mentouri Constantine', credit: 7000000 },
        { name: 'Clinique Privée El Yasmine', credit: 5000000 },
        { name: 'Restaurant Le Bey Alger', credit: 3000000 }
    ];

    const customers = [];
    for (const d of custData) {
        const c = await prisma.customer.create({
            data: {
                companyId: cid,
                name: d.name,
                creditLimit: d.credit,
                isActive: true
            }
        });
        customers.push(c);
    }

    // ====================================
    // 5. TRANSACTIONS
    // ====================================
    console.log('📦 Generating Purchase Orders (15)...');
    for (let i = 0; i < 15; i++) {
        const date = randomDate(SIMULATION_START, SIMULATION_END);
        const po = await prisma.purchaseOrder.create({
            data: {
                companyId: cid,
                reference: `BCF-26-${(i + 1).toString().padStart(3, '0')}`,
                supplierId: suppliers[i % suppliers.length].id,
                status: i === 14 ? 'SENT' : 'RECEIVED',
                orderDate: date,
                totalHt: randomInt(500000, 3000000),
                totalTva: 0, totalTtc: 0
            }
        });
        await prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { totalTva: Number(po.totalHt) * 0.19, totalTtc: Number(po.totalHt) * 1.19 }
        });

        if (po.status === 'RECEIVED') {
            await prisma.stockReception.create({
                data: {
                    companyId: cid,
                    purchaseOrderId: po.id,
                    reference: `REC-${po.reference}`,
                    warehouseId: warehouse.id,
                    status: 'VALIDATED',
                    receivedAt: date
                }
            });
        }
    }

    console.log('💼 Generating Sales Orders (45)...');
    for (let i = 0; i < 45; i++) {
        const date = randomDate(SIMULATION_START, SIMULATION_END);
        const so = await prisma.salesOrder.create({
            data: {
                companyId: cid,
                reference: `BC-26-${(i + 1).toString().padStart(3, '0')}`,
                customerId: customers[i % customers.length].id,
                status: 'INVOICED',
                date: date,
                totalAmountHt: randomInt(300000, 1500000),
                totalAmountTva: 0, totalAmountTtc: 0
            }
        });
        const ht = Number(so.totalAmountHt);
        const ttc = ht * 1.19;
        await prisma.salesOrder.update({
            where: { id: so.id },
            data: { totalAmountTva: ht * 0.19, totalAmountTtc: ttc }
        });

        // 35 Invoices
        if (i < 35) {
            const invStatus = i < 15 ? 'PAID' : (i < 25 ? 'PARTIAL' : 'SENT');
            const amtPaid = invStatus === 'PAID' ? ttc : (invStatus === 'PARTIAL' ? ttc * 0.4 : 0);
            
            const inv = await prisma.invoice.create({
                data: {
                    companyId: cid,
                    salesOrderId: so.id,
                    customerId: so.customerId,
                    reference: `FACT-26-${(i+1).toString().padStart(3, '0')}`,
                    status: invStatus === 'SENT' ? 'SENT' : (invStatus === 'PAID' ? 'PAID' : 'PARTIAL'),
                    date: date,
                    totalAmountHt: ht,
                    totalAmountTva: ht * 0.19,
                    totalAmountTtc: ttc,
                    amountPaid: amtPaid,
                    amountRemaining: ttc - amtPaid,
                    paymentMethod: 'TRANSFER'
                }
            });

            if (amtPaid > 0) {
                await prisma.payment.create({
                    data: {
                        companyId: cid,
                        invoiceId: inv.id,
                        amount: amtPaid,
                        date: date,
                        method: 'TRANSFER'
                    }
                });
            }
        }
    }

    console.log('🏭 Generating Manufacturing Orders (12)...');
    for (let i = 0; i < 12; i++) {
        const prod = randomChoice(productsPF);
        await prisma.manufacturingOrder.create({
            data: {
                companyId: cid,
                reference: `OF-26-${(i+1).toString().padStart(3, '0')}`,
                productId: prod.id,
                formulaId: (await prisma.productFormula.findFirst({ where: { productId: prod.id } }))!.id,
                status: 'COMPLETED',
                plannedQuantity: 100,
                producedQuantity: 100,
                unit: prod.unit,
                plannedDate: SIMULATION_START,
                completedAt: new Date(),
                totalActualCost: 50000
            }
        });
    }

    console.log('💸 Generating Expenses (20)...');
    const categories = ['TRANSPORT', 'MAINTENANCE', 'ADMINISTRATIVE', 'UTILITIES'];
    for (let i = 0; i < 20; i++) {
        await prisma.expense.create({
            data: {
                companyId: cid,
                title: `${randomChoice(categories)} Weekly Payment ${i+1}`,
                amount: randomInt(10000, 100000),
                category: randomChoice(categories),
                date: randomDate(SIMULATION_START, SIMULATION_END),
                paymentMethod: 'CASH'
            }
        });
    }

    console.log('\n🚀 Simulation Complete for aymenCO!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
