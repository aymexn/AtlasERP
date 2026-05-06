import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ================================================================
// CONFIGURATION
// ================================================================

const COMPANY_ID = 'ae144f97-26c9-4c6a-b1dc-e48834f18553';
const SIMULATION_START = new Date('2026-03-01T08:00:00Z');
const SIMULATION_END = new Date('2026-04-30T18:00:00Z');

// Helper functions
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🎨 Starting Atlas Peinture - Complete 2-Month Simulation');
  console.log(`📅 Period: ${SIMULATION_START.toLocaleDateString()} → ${SIMULATION_END.toLocaleDateString()}`);
  console.log(`🏢 Company ID: ${COMPANY_ID}`);
  console.log('');

  // ================================================================
  // 0. CLEANUP (Tenant Isolation)
  // ================================================================
  console.log('🧹 Cleaning up existing data for the tenant...');
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.payment.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.expense.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.invoice.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.stockMovement.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.stockReceptionLine.deleteMany({ where: { reception: { companyId: COMPANY_ID } } }),
    prisma.stockReception.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrder: { companyId: COMPANY_ID } } }),
    prisma.purchaseOrder.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.salesOrderLine.deleteMany({ where: { salesOrder: { companyId: COMPANY_ID } } }),
    prisma.salesOrder.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.manufacturingOrderLine.deleteMany({ where: { manufacturingOrder: { companyId: COMPANY_ID } } }),
    prisma.manufacturingOrder.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.bOMComponent.deleteMany({ where: { bom: { companyId: COMPANY_ID } } }),
    prisma.billOfMaterials.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.productStock.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.warehouse.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.product.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.productFamily.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.customer.deleteMany({ where: { companyId: COMPANY_ID } }),
    prisma.supplier.deleteMany({ where: { companyId: COMPANY_ID } }),
  ]);
  console.log('✅ Cleanup complete.');

  // Create Default Warehouse
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Entrepôt Principal Atlas',
      code: 'WH-MAIN',
      location: 'Zone Industrielle Rouiba',
    }
  });

  // ================================================================
  // 1. PRODUCT FAMILIES
  // ================================================================
  console.log('📦 Creating Product Families...');

  const famMatieresPremieres = await prisma.productFamily.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Matières Premières',
      code: 'MP',
      sortOrder: 1,
      colorBadge: '#8B5CF6',
      description: 'Résines, pigments, solvants, charges, additifs pour fabrication'
    }
  });

  const famAtlasPro = await prisma.productFamily.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Atlas Pro - Peintures Décoratives',
      code: 'ATLAS-PRO',
      sortOrder: 2,
      colorBadge: '#3B82F6',
      description: 'Gamme professionnelle décoration intérieure/extérieure'
    }
  });

  const famIndustrie = await prisma.productFamily.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Industrie - Revêtements Techniques',
      code: 'IND',
      sortOrder: 3,
      colorBadge: '#EF4444',
      description: 'Peintures industrielles anticorrosion, époxy, sols'
    }
  });

  const famPreparation = await prisma.productFamily.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Préparation & Finition',
      code: 'PREP',
      sortOrder: 4,
      colorBadge: '#10B981',
      description: 'Enduits, apprêts, vernis, sous-couches'
    }
  });

  const famEmballages = await prisma.productFamily.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Emballages & Conditionnement',
      code: 'EMB',
      sortOrder: 5,
      colorBadge: '#F59E0B',
      description: 'Seaux, bidons, contenants vides'
    }
  });

  // ================================================================
  // 2. RAW MATERIALS
  // ================================================================
  console.log('🧪 Creating Raw Materials...');

  const createRM = async (name: string, sku: string, familyId: string, price: number, unit: string, minStock: number) => {
    return await prisma.product.create({
      data: {
        companyId: COMPANY_ID,
        familyId,
        name,
        sku,
        articleType: familyId === famEmballages.id ? 'PACKAGING' : 'RAW_MATERIAL',
        purchasePriceHt: price,
        standardCost: price,
        stockQuantity: 0,
        minStock: minStock,
        unit,
        isActive: true,
        taxRate: 0,
        salePriceHt: 0
      }
    });
  };

  const rmProducts = {
    resineAcrylique: await createRM('Résine Acrylique Base Eau RAL', 'MP-RES-ACR-001', famMatieresPremieres.id, 165.0, 'KG', 500),
    resineEpoxy: await createRM('Résine Époxy Bi-composant High Performance', 'MP-RES-EPO-002', famMatieresPremieres.id, 320.0, 'KG', 200),
    resineAlkyde: await createRM('Résine Alkyde Glycérophtalique Premium', 'MP-RES-ALK-003', famMatieresPremieres.id, 215.0, 'KG', 300),
    resinePolyurethane: await createRM('Résine Polyuréthane Haute Résistance', 'MP-RES-PU-004', famMatieresPremieres.id, 360.0, 'KG', 150),
    
    pigmentBlanc: await createRM('Pigment Blanc Dioxyde de Titane TiO2', 'MP-PIG-BLA-005', famMatieresPremieres.id, 150.0, 'KG', 600),
    pigmentRouge: await createRM('Pigment Rouge Oxyde de Fer', 'MP-PIG-ROU-006', famMatieresPremieres.id, 125.0, 'KG', 200),
    pigmentBleu: await createRM('Pigment Bleu Phtalocyanine', 'MP-PIG-BLE-007', famMatieresPremieres.id, 140.0, 'KG', 150),
    pigmentJaune: await createRM('Pigment Jaune Oxyde de Chrome', 'MP-PIG-JAU-008', famMatieresPremieres.id, 130.0, 'KG', 150),
    pigmentVert: await createRM('Pigment Vert Oxyde de Chrome', 'MP-PIG-VER-009', famMatieresPremieres.id, 140.0, 'KG', 150),
    pigmentNoir: await createRM('Pigment Noir Carbone', 'MP-PIG-NOI-010', famMatieresPremieres.id, 110.0, 'KG', 300),
    
    solvantUniversel: await createRM('Solvant Universel Dégraissant', 'MP-SOL-UNI-011', famMatieresPremieres.id, 65.0, 'L', 1000),
    durcisseurEpoxy: await createRM('Durcisseur Époxy Amine Aliphatique', 'MP-DUR-EPO-012', famMatieresPremieres.id, 235.0, 'KG', 150),
    additifAntiUV: await createRM('Additif Anti-UV Protection Solaire', 'MP-ADD-UV-013', famMatieresPremieres.id, 150.0, 'KG', 100),
    additifAntiMoisissure: await createRM('Additif Anti-Moisissure Fongicide', 'MP-ADD-MOI-014', famMatieresPremieres.id, 120.0, 'KG', 100),
    epaississant: await createRM('Épaississant Cellulosique Hydroxyéthyl', 'MP-EPA-CEL-015', famMatieresPremieres.id, 85.0, 'KG', 200),
    
    chargesCarbonate: await createRM('Charges Carbonate de Calcium Micronisé', 'MP-CHA-CAR-016', famMatieresPremieres.id, 30.0, 'KG', 2000),
    chargesTalc: await createRM('Charges Talc Industriel', 'MP-CHA-TAL-017', famMatieresPremieres.id, 35.0, 'KG', 1500),
    
    seau5L: await createRM('Seau Plastique 5L', 'EMB-SEA-5L-018', famEmballages.id, 8.0, 'PCS', 1000),
    seau10L: await createRM('Seau Plastique 10L', 'EMB-SEA-10L-019', famEmballages.id, 12.0, 'PCS', 800),
    bidon20L: await createRM('Bidon Métallique 20L', 'EMB-BID-20L-020', famEmballages.id, 22.0, 'PCS', 500)
  };

  const rmList = Object.values(rmProducts);

  // ================================================================
  // 3. FINISHED PRODUCTS & BOMs
  // ================================================================
  console.log('🎨 Creating Finished Products with BOM Formulas...');

  const fpList: any[] = [];
  const bomsToCalculate: any[] = [];

  const createFP = async (name: string, sku: string, familyId: string, salePrice: number, minStock: number, components: any[]) => {
    const fp = await prisma.product.create({
      data: {
        companyId: COMPANY_ID,
        familyId,
        name,
        sku,
        articleType: 'FINISHED_PRODUCT',
        salePriceHt: salePrice,
        taxRate: 0.19,
        standardCost: 0,
        stockQuantity: 0,
        minStock: minStock,
        unit: 'PCS',
        isActive: true,
      }
    });

    const bom = await prisma.billOfMaterials.create({
      data: {
        companyId: COMPANY_ID,
        productId: fp.id,
        name: `BOM - ${name}`,
        version: '1.0',
        status: 'ACTIVE',
        outputQuantity: 1,
        outputUnit: 'PCS',
        components: {
          create: components.map((c, i) => ({
            componentProductId: c.rm.id,
            quantity: c.qty,
            unit: c.rm.unit,
            sortOrder: i
          }))
        }
      }
    });

    bomsToCalculate.push({ productId: fp.id, bomId: bom.id, components });
    fpList.push(fp);
    return fp;
  };

  await createFP('Atlas Pro Mat Blanc Neige 5L', 'PF-ATLAS-MAT-BLA-5L', famAtlasPro.id, 2800.0, 50, [
    { rm: rmProducts.resineAcrylique, qty: 3.2 },
    { rm: rmProducts.pigmentBlanc, qty: 0.8 },
    { rm: rmProducts.chargesCarbonate, qty: 0.5 },
    { rm: rmProducts.epaississant, qty: 0.15 },
    { rm: rmProducts.additifAntiMoisissure, qty: 0.05 },
    { rm: rmProducts.seau5L, qty: 1 }
  ]);

  await createFP('Atlas Pro Satin Gris Perle 10L', 'PF-ATLAS-SAT-GRI-10L', famAtlasPro.id, 5200.0, 30, [
    { rm: rmProducts.resineAcrylique, qty: 6.8 },
    { rm: rmProducts.pigmentBlanc, qty: 1.2 },
    { rm: rmProducts.pigmentNoir, qty: 0.15 },
    { rm: rmProducts.chargesCarbonate, qty: 1.0 },
    { rm: rmProducts.epaississant, qty: 0.3 },
    { rm: rmProducts.additifAntiUV, qty: 0.1 },
    { rm: rmProducts.seau10L, qty: 1 }
  ]);

  await createFP('Atlas Pro Brillant Rouge Bordeaux 5L', 'PF-ATLAS-BRI-ROU-5L', famAtlasPro.id, 3600.0, 40, [
    { rm: rmProducts.resineAlkyde, qty: 3.5 },
    { rm: rmProducts.pigmentRouge, qty: 0.6 },
    { rm: rmProducts.solvantUniversel, qty: 0.4 },
    { rm: rmProducts.additifAntiUV, qty: 0.08 },
    { rm: rmProducts.seau5L, qty: 1 }
  ]);

  await createFP('Atlas Pro Façade Anti-UV Blanc 10L', 'PF-ATLAS-FAC-BLA-10L', famAtlasPro.id, 5600.0, 25, [
    { rm: rmProducts.resineAcrylique, qty: 7.2 },
    { rm: rmProducts.pigmentBlanc, qty: 1.5 },
    { rm: rmProducts.chargesCarbonate, qty: 1.2 },
    { rm: rmProducts.additifAntiUV, qty: 0.25 },
    { rm: rmProducts.additifAntiMoisissure, qty: 0.15 },
    { rm: rmProducts.seau10L, qty: 1 }
  ]);

  await createFP('Atlas Pro Mur Bleu Azur 2.5L', 'PF-ATLAS-MUR-BLE-2.5L', famAtlasPro.id, 1800.0, 60, [
    { rm: rmProducts.resineAcrylique, qty: 1.6 },
    { rm: rmProducts.pigmentBleu, qty: 0.25 },
    { rm: rmProducts.pigmentBlanc, qty: 0.3 },
    { rm: rmProducts.chargesCarbonate, qty: 0.2 },
    { rm: rmProducts.epaississant, qty: 0.08 },
    { rm: rmProducts.seau5L, qty: 1 }
  ]);

  await createFP('Anticorrosion Industriel Haute Protection 20L', 'PF-IND-ANTI-20L', famIndustrie.id, 6500.0, 15, [
    { rm: rmProducts.resineEpoxy, qty: 10.0 },
    { rm: rmProducts.durcisseurEpoxy, qty: 3.5 },
    { rm: rmProducts.pigmentRouge, qty: 0.8 },
    { rm: rmProducts.chargesTalc, qty: 2.0 },
    { rm: rmProducts.bidon20L, qty: 1 }
  ]);

  await createFP('Époxy Sol Trafic Intense Gris 20kg', 'PF-IND-EPO-SOL-20KG', famIndustrie.id, 6800.0, 10, [
    { rm: rmProducts.resineEpoxy, qty: 11.0 },
    { rm: rmProducts.durcisseurEpoxy, qty: 4.0 },
    { rm: rmProducts.pigmentNoir, qty: 0.3 },
    { rm: rmProducts.pigmentBlanc, qty: 0.5 },
    { rm: rmProducts.chargesTalc, qty: 3.0 },
    { rm: rmProducts.bidon20L, qty: 1 }
  ]);

  await createFP('Polyuréthane Haute Résistance Transparent 10L', 'PF-IND-PU-TRANS-10L', famIndustrie.id, 5800.0, 20, [
    { rm: rmProducts.resinePolyurethane, qty: 7.5 },
    { rm: rmProducts.solvantUniversel, qty: 1.5 },
    { rm: rmProducts.additifAntiUV, qty: 0.2 },
    { rm: rmProducts.seau10L, qty: 1 }
  ]);

  await createFP('Époxy Cristal Clear Transparent 10kg', 'PF-IND-EPO-CLEAR-10KG', famIndustrie.id, 5000.0, 15, [
    { rm: rmProducts.resineEpoxy, qty: 6.5 },
    { rm: rmProducts.durcisseurEpoxy, qty: 2.2 },
    { rm: rmProducts.seau10L, qty: 1 }
  ]);

  await createFP('Enduit de Rebouchage Pâte Prête 5kg', 'PF-PREP-END-5KG', famPreparation.id, 1600.0, 80, [
    { rm: rmProducts.resineAcrylique, qty: 2.0 },
    { rm: rmProducts.chargesCarbonate, qty: 2.5 },
    { rm: rmProducts.epaississant, qty: 0.3 },
    { rm: rmProducts.seau5L, qty: 1 }
  ]);

  await createFP('Apprêt Accrochage Universel Multi-Support 10L', 'PF-PREP-APP-10L', famPreparation.id, 2500.0, 40, [
    { rm: rmProducts.resineAcrylique, qty: 5.5 },
    { rm: rmProducts.pigmentBlanc, qty: 1.2 },
    { rm: rmProducts.chargesCarbonate, qty: 1.5 },
    { rm: rmProducts.epaississant, qty: 0.2 },
    { rm: rmProducts.seau10L, qty: 1 }
  ]);

  await createFP('Vernis Bois Brillant Polyuréthane 5L', 'PF-PREP-VER-5L', famPreparation.id, 3000.0, 30, [
    { rm: rmProducts.resinePolyurethane, qty: 3.8 },
    { rm: rmProducts.solvantUniversel, qty: 0.8 },
    { rm: rmProducts.additifAntiUV, qty: 0.12 },
    { rm: rmProducts.seau5L, qty: 1 }
  ]);

  // Calculate and update standard costs
  for (const b of bomsToCalculate) {
    let totalCost = 0;
    for (const c of b.components) {
      totalCost += c.qty * Number(c.rm.standardCost);
    }
    await prisma.product.update({
      where: { id: b.productId },
      data: { standardCost: totalCost }
    });
    const fpIndex = fpList.findIndex(f => f.id === b.productId);
    if(fpIndex >= 0) fpList[fpIndex].standardCost = totalCost as any;
  }

  // ================================================================
  // 4. SUPPLIERS & CUSTOMERS
  // ================================================================
  console.log('🏭👥 Creating Partners...');

  const supplierBASF = await prisma.supplier.create({ data: { companyId: COMPANY_ID, name: 'BASF Chimie Algérie SARL', nif: '099216034125678', rc: '16/00-0987654', isActive: true } });
  const supplierDOW = await prisma.supplier.create({ data: { companyId: COMPANY_ID, name: 'DOW Chemical Algérie', nif: '099316045236789', rc: '31/00-1234567', isActive: true } });
  const supplierColorants = await prisma.supplier.create({ data: { companyId: COMPANY_ID, name: 'Colorants de l\'Est EURL', nif: '099425056347890', rc: '25/00-2345678', isActive: true } });
  const supplierEmballages = await prisma.supplier.create({ data: { companyId: COMPANY_ID, name: 'Emballages Plastiques du Chelif SPA', nif: '099002067458901', rc: '02/00-3456789', isActive: true } });
  const supplierArkema = await prisma.supplier.create({ data: { companyId: COMPANY_ID, name: 'Arkema Algeria SpA', nif: '099216078569012', rc: '16/00-4567890', isActive: true } });
  const supplierSika = await prisma.supplier.create({ data: { companyId: COMPANY_ID, name: 'Sika Solutions Algérie SARL', nif: '099619089670123', rc: '19/00-5678901', isActive: true } });
  const suppliers = [supplierBASF, supplierDOW, supplierColorants, supplierEmballages, supplierArkema, supplierSika];

  const customersData = [
    { name: 'Promotion Immobilière Bab Ezzouar SARL', taxId: '099216100781234' },
    { name: 'Ets Bouaziz Peinture & Décoration', taxId: '099425111892345' },
    { name: 'SARL Peintre Pro Oran', taxId: '099341122903456' },
    { name: 'Quincaillerie Atlas Moderne EURL', taxId: '099216133014567' },
    { name: 'Entreprise Générale du Bâtiment Sétif SPA', taxId: '099619144125678' },
    { name: 'Décor Luxe Intérieur SARL', taxId: '099216155236789' },
    { name: 'Hôtel Méridien Oran', taxId: '099341166347890' },
    { name: 'Université Mentouri Constantine', taxId: '099425177458901' },
    { name: 'Clinique Privée El Yasmine', taxId: '099216188569012' },
    { name: 'Restaurant Le Bey Alger', taxId: '099216199670123' }
  ];
  const customers = [];
  for (const cd of customersData) {
    customers.push(await prisma.customer.create({ data: { companyId: COMPANY_ID, name: cd.name, taxId: cd.taxId, isActive: true } }));
  }

  // ================================================================
  // 5. CHRONOLOGICAL SIMULATION
  // ================================================================
  console.log('⏳ Running chronological simulation (6 Months: Procurement -> Production -> Sales)...');

  // Pareto Distribution for Sales: 20% of products get 80% of sales
  const topFP = fpList.slice(0, Math.ceil(fpList.length * 0.2));
  const otherFP = fpList.slice(Math.ceil(fpList.length * 0.2));

  let currentRefId = 1;
  const EXTENDED_START = new Date(SIMULATION_START);
  EXTENDED_START.setMonth(EXTENDED_START.getMonth() - 4); // Total 6 months
  const daysDiff = Math.floor((SIMULATION_END.getTime() - EXTENDED_START.getTime()) / (1000 * 3600 * 24));

  const localStock: Record<string, number> = {};
  rmList.forEach(rm => localStock[rm.id] = 0);
  fpList.forEach(fp => localStock[fp.id] = 0);

  for (let day = 0; day <= daysDiff; day++) {
    const currentDate = addDays(EXTENDED_START, day);
    
    // A. PROCUREMENT (Receptions)
    if (day % 5 === 0 || day === 0) {
      const numOfPOs = day === 0 ? 8 : randomInt(1, 4);
      for (let i = 0; i < numOfPOs; i++) {
        const supplier = randomChoice(suppliers);
        const numRM = randomInt(4, 10);
        const selectedRMs = [...rmList].sort(() => 0.5 - Math.random()).slice(0, numRM);
        
        const po = await prisma.purchaseOrder.create({
          data: {
            companyId: COMPANY_ID,
            reference: `BCF-2026-${String(currentRefId++).padStart(4, '0')}`,
            supplierId: supplier.id,
            status: 'RECEIVED',
            orderDate: addDays(currentDate, -2),
            totalHt: 0, totalTva: 0, totalTtc: 0
          }
        });

        const reception = await prisma.stockReception.create({
          data: {
            companyId: COMPANY_ID,
            purchaseOrderId: po.id,
            reference: `REC-${po.reference}`,
            warehouseId: mainWarehouse.id,
            status: 'VALIDATED',
            receivedAt: currentDate,
            validatedAt: currentDate
          }
        });

        let poTotalHt = 0;
        for (const rm of selectedRMs) {
          const receivedQty = randomInt(800, 3000);
          const lineCost = Number(rm.purchasePriceHt);
          poTotalHt += receivedQty * lineCost;
          
          await prisma.stockReceptionLine.create({
            data: {
              receptionId: reception.id,
              productId: rm.id,
              expectedQty: receivedQty,
              receivedQty: receivedQty,
              unit: rm.unit,
              unitCost: lineCost
            }
          });

          await prisma.stockMovement.create({
            data: {
              companyId: COMPANY_ID,
              productId: rm.id,
              quantity: receivedQty,
              movementType: 'IN',
              type: 'IN',
              reference: reception.reference,
              reason: 'Réception Fournisseur',
              date: currentDate,
              unitCost: lineCost,
              totalCost: receivedQty * lineCost,
              unit: rm.unit,
              warehouseToId: mainWarehouse.id
            }
          });

          localStock[rm.id] += receivedQty;
          await prisma.product.update({
            where: { id: rm.id },
            data: { 
              stockQuantity: { increment: receivedQty },
              stockValue: { increment: receivedQty * lineCost }
            }
          });
        }

        await prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { 
            totalHt: poTotalHt,
            totalTva: poTotalHt * 0.19,
            totalTtc: poTotalHt * 1.19
          }
        });
      }
    }

    // B. PRODUCTION (Manufacturing Orders)
    if (day > 2 && randomInt(1, 100) > 25) {
      const numProd = randomInt(1, 4);
      for (let j = 0; j < numProd; j++) {
        const fp = randomChoice(fpList);
        const bomData = bomsToCalculate.find(b => b.productId === fp.id);
        if (!bomData) continue;

        const qtyToProduce = randomInt(100, 500);
        let canProduce = true;
        for (const comp of bomData.components) {
          if (localStock[comp.rm.id] < comp.qty * qtyToProduce) {
            canProduce = false;
            break;
          }
        }

        if (canProduce) {
          const mo = await prisma.manufacturingOrder.create({
            data: {
              companyId: COMPANY_ID,
              reference: `OF-2026-${String(currentRefId++).padStart(4, '0')}`,
              productId: fp.id,
              formulaId: bomData.bomId,
              status: 'COMPLETED',
              plannedQuantity: qtyToProduce,
              producedQuantity: qtyToProduce,
              unit: 'PCS',
              plannedDate: currentDate,
              startedAt: currentDate,
              completedAt: addDays(currentDate, 1),
              totalEstimatedCost: Number(fp.standardCost) * qtyToProduce,
              totalActualCost: Number(fp.standardCost) * qtyToProduce,
              warehouseId: mainWarehouse.id
            }
          });

          for (const comp of bomData.components) {
            const consumedQty = comp.qty * qtyToProduce;
            const cost = Number(comp.rm.standardCost);
            await prisma.stockMovement.create({
              data: {
                companyId: COMPANY_ID,
                productId: comp.rm.id,
                quantity: -consumedQty,
                movementType: 'OUT',
                type: 'OUT',
                reference: mo.reference,
                reason: 'Consommation Production',
                date: currentDate,
                unitCost: cost,
                totalCost: consumedQty * cost,
                unit: comp.rm.unit,
                warehouseFromId: mainWarehouse.id
              }
            });
            localStock[comp.rm.id] -= consumedQty;
            await prisma.product.update({ where: { id: comp.rm.id }, data: { stockQuantity: { decrement: consumedQty }, stockValue: { decrement: consumedQty * cost } } });
          }

          await prisma.stockMovement.create({
            data: {
              companyId: COMPANY_ID,
              productId: fp.id,
              quantity: qtyToProduce,
              movementType: 'IN',
              type: 'IN',
              reference: mo.reference,
              reason: 'Entrée Production',
              date: addDays(currentDate, 1),
              unitCost: Number(fp.standardCost),
              totalCost: qtyToProduce * Number(fp.standardCost),
              unit: 'PCS',
              warehouseToId: mainWarehouse.id
            }
          });
          localStock[fp.id] += qtyToProduce;
          await prisma.product.update({ where: { id: fp.id }, data: { stockQuantity: { increment: qtyToProduce }, stockValue: { increment: qtyToProduce * Number(fp.standardCost) } } });
        }
      }
    }

    // C. SALES (Pareto Distribution)
    if (day > 10) {
      const numSales = randomInt(2, 8);
      for (let i = 0; i < numSales; i++) {
        const randPareto = Math.random();
        const pool = randPareto < 0.8 ? topFP : otherFP;
        const availableProducts = pool.filter(fp => localStock[fp.id] > 5);
        if (availableProducts.length === 0) continue;

        const customer = randomChoice(customers);
        const productsToSell = availableProducts.sort(() => 0.5 - Math.random()).slice(0, randomInt(1, 3));
        
        let totalAmountHt = 0;
        const linesData = [];
        for (const fp of productsToSell) {
          const qty = randomInt(5, 40);
          const lineTotal = qty * Number(fp.salePriceHt);
          totalAmountHt += lineTotal;
          linesData.push({ productId: fp.id, quantity: qty, unitPriceHt: Number(fp.salePriceHt), lineTotalHt: lineTotal, unit: 'PCS', taxRate: 0.19, lineTotalTtc: lineTotal * 1.19, unitCostSnapshot: Number(fp.standardCost) });
        }

        if (linesData.length === 0) continue;
        const totalAmountTtc = totalAmountHt * 1.19;

        const so = await prisma.salesOrder.create({
          data: {
            companyId: COMPANY_ID,
            reference: `BC-2026-${String(currentRefId++).padStart(4, '0')}`,
            customerId: customer.id,
            date: currentDate,
            status: 'INVOICED',
            totalAmountHt,
            totalAmountTva: totalAmountHt * 0.19,
            totalAmountTtc,
            completedAt: currentDate,
            lines: { create: linesData }
          }
        });

        for (const line of linesData) {
          await prisma.stockMovement.create({
            data: {
              companyId: COMPANY_ID,
              productId: line.productId,
              quantity: -line.quantity,
              movementType: 'OUT',
              type: 'OUT',
              reference: so.reference,
              reason: 'Vente Client',
              date: currentDate,
              unitCost: line.unitCostSnapshot,
              totalCost: line.quantity * line.unitCostSnapshot,
              unit: 'PCS',
              warehouseFromId: mainWarehouse.id
            }
          });
          localStock[line.productId] -= line.quantity;
          await prisma.product.update({ where: { id: line.productId }, data: { stockQuantity: { decrement: line.quantity }, stockValue: { decrement: line.quantity * line.unitCostSnapshot } } });
        }

        // Invoice & Payment logic
        const invStatus = Math.random() > 0.4 ? 'PAID' : (Math.random() > 0.5 ? 'PARTIAL' : 'SENT');
        const amountPaid = invStatus === 'PAID' ? totalAmountTtc : (invStatus === 'PARTIAL' ? totalAmountTtc * 0.4 : 0);
        
        const invoice = await prisma.invoice.create({
          data: {
            companyId: COMPANY_ID,
            reference: `FAC-${so.reference}`,
            customerId: customer.id,
            salesOrderId: so.id,
            date: addDays(currentDate, 1),
            dueDate: addDays(currentDate, 31),
            totalAmountHt,
            totalAmountTva: totalAmountHt * 0.19,
            totalAmountTtc,
            amountPaid,
            amountRemaining: totalAmountTtc - amountPaid,
            paymentMethod: 'TRANSFER',
            status: invStatus as any
          }
        });

        if (amountPaid > 0) {
          await prisma.payment.create({
            data: {
              companyId: COMPANY_ID,
              invoiceId: invoice.id,
              date: addDays(currentDate, 1),
              amount: amountPaid,
              method: 'TRANSFER',
              reference: `PYM-${invoice.reference}`
            }
          });
        }
      }
    }
  }

  // D. SEED ANALYTICS TABLES (Post-Simulation)
  console.log('📊 Seeding ABC Classifications & Dead Stock...');
  const allProducts = await prisma.product.findMany({ where: { companyId: COMPANY_ID, isActive: true } });
  
  for (const p of allProducts) {
    const isTop = topFP.some(tfp => tfp.id === p.id);
    const isC = !isTop && Math.random() > 0.7;

    await prisma.abcClassification.create({
      data: {
        companyId: COMPANY_ID,
        productId: p.id,
        classification: isTop ? 'A' : (isC ? 'C' : 'B'),
        annualRevenue: isTop ? 5000000 : (isC ? 50000 : 800000),
        annualUnitsSold: isTop ? 2000 : (isC ? 20 : 400),
        revenuePercentage: isTop ? 15.5 : (isC ? 0.2 : 4.5),
        cumulativeRevenuePercentage: isTop ? 40 : (isC ? 99 : 85),
        averageStockValue: 100000,
        stockTurnoverRate: isTop ? 12 : 1.5,
        daysInStock: isTop ? 30 : 240,
        periodStart: EXTENDED_START,
        periodEnd: SIMULATION_END
      } as any
    });

    // Seed some dead stock (low performance products)
    if (isC && Math.random() > 0.5) {
      await prisma.deadStockItem.create({
        data: {
          companyId: COMPANY_ID,
          productId: p.id,
          warehouseId: mainWarehouse.id,
          quantity: randomInt(50, 200),
          stockValue: randomInt(50000, 200000),
          daysWithoutSale: randomInt(100, 400),
          daysSincePurchase: randomInt(150, 500),
          category: randomChoice(['obsolete', 'slow_moving']),
          actionRecommended: 'discount'
        } as any
      });
    }
  }

  // E. EXPENSES (6 Months)
  console.log('💸 Creating Operational Expenses...');
  const expenseCategories = [
    { category: 'TRANSPORT', baseAmount: 12000, title: 'Carburant Flotte' },
    { category: 'MAINTENANCE', baseAmount: 25000, title: 'Entretien Machines' },
    { category: 'UTILITIES', baseAmount: 35000, title: 'Loyer & Électricité' },
    { category: 'MARKETING', baseAmount: 15000, title: 'Campagne Publicitaire' }
  ];

  for (let month = 0; month < 6; month++) {
    for (const expCat of expenseCategories) {
      await prisma.expense.create({
        data: {
          companyId: COMPANY_ID,
          title: `${expCat.title} - M${month + 1}`,
          category: expCat.category,
          date: addDays(EXTENDED_START, month * 30 + randomInt(1, 28)),
          amount: expCat.baseAmount + randomInt(-3000, 8000)
        }
      });
    }
  }

  console.log('✅ Created Expenses');
  console.log('🎉 INDUSTRIAL SIMULATION COMPLETED');
}

main()
  .catch((e) => {
    console.error('❌ SIMULATION FAILED:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

