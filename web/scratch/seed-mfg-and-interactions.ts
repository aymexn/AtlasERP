import { prisma } from '../src/lib/prisma';
import { Prisma } from '@prisma/client';

async function main() {
  console.log('--- SEEDING MFG, FORMULAS, INTERACTIONS & SETTINGS ---');
  
  // 1. Get company Cameleon Colors
  const company = await prisma.company.findFirst({ where: { name: 'Cameleon Colors' } });
  if (!company) {
    console.error('Company Cameleon Colors not found');
    return;
  }
  const companyId = company.id;
  console.log(`Found Cameleon Colors: ${companyId}`);

  // 2. Get warehouse
  const wh = await prisma.warehouse.findFirst({ where: { companyId } });
  if (!wh) {
    console.error('No warehouse found for Cameleon Colors');
    return;
  }
  console.log(`Warehouse ID: ${wh.id}`);

  // 3. Update monthly revenue target setting in Company settings JSON
  await prisma.company.update({
    where: { id: companyId },
    data: {
      settings: {
        monthly_revenue_target: 1000000
      }
    }
  });
  console.log('✓ Updated Company settings: { monthly_revenue_target: 1000000 }');

  // 4. Get products
  const pi001 = await prisma.product.findFirst({ where: { companyId, sku: 'PI-001' } });
  const pi002 = await prisma.product.findFirst({ where: { companyId, sku: 'PI-002' } });
  const sv001 = await prisma.product.findFirst({ where: { companyId, sku: 'SV-001' } });
  const sv002 = await prisma.product.findFirst({ where: { companyId, sku: 'SV-002' } });

  if (!pi001 || !pi002 || !sv001 || !sv002) {
    console.error('Required products (PI-001, PI-002, SV-001, SV-002) not found');
    return;
  }
  console.log(`Products:
- PI-001: ${pi001.id}
- PI-002: ${pi002.id}
- SV-001: ${sv001.id}
- SV-002: ${sv002.id}`);

  // 5. Seed Bill of Materials (BOM)
  console.log('\nChecking Bill of Materials (Formulas)...');
  let bom1 = await prisma.billOfMaterials.findFirst({ where: { companyId, productId: pi001.id } });
  if (!bom1) {
    bom1 = await prisma.billOfMaterials.create({
      data: {
        companyId,
        productId: pi001.id,
        name: 'Formule Blanc Mat Standard',
        code: 'BOM-PI-001',
        description: 'Formulation standard pour Peinture Vinylique Blanc Mat',
        outputQuantity: new Prisma.Decimal(10.0),
        outputUnit: 'L',
        scrapPercent: new Prisma.Decimal(2.0),
        status: 'ACTIVE',
        components: {
          create: [
            {
              componentProductId: sv001.id,
              quantity: new Prisma.Decimal(2.0),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.0),
              sortOrder: 1
            },
            {
              componentProductId: sv002.id,
              quantity: new Prisma.Decimal(1.0),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.5),
              sortOrder: 2
            }
          ]
        }
      }
    });
    console.log(`✓ Created BOM for PI-001: ${bom1.id}`);
  } else {
    console.log(`BOM for PI-001 already exists: ${bom1.id}`);
  }

  let bom2 = await prisma.billOfMaterials.findFirst({ where: { companyId, productId: pi002.id } });
  if (!bom2) {
    bom2 = await prisma.billOfMaterials.create({
      data: {
        companyId,
        productId: pi002.id,
        name: 'Formule Blanc Satin Standard',
        code: 'BOM-PI-002',
        description: 'Formulation standard pour Peinture Vinylique Blanc Satin',
        outputQuantity: new Prisma.Decimal(10.0),
        outputUnit: 'L',
        scrapPercent: new Prisma.Decimal(3.0),
        status: 'ACTIVE',
        components: {
          create: [
            {
              componentProductId: sv001.id,
              quantity: new Prisma.Decimal(2.5),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.2),
              sortOrder: 1
            },
            {
              componentProductId: sv002.id,
              quantity: new Prisma.Decimal(1.5),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.8),
              sortOrder: 2
            }
          ]
        }
      }
    });
    console.log(`✓ Created BOM for PI-002: ${bom2.id}`);
  } else {
    console.log(`BOM for PI-002 already exists: ${bom2.id}`);
  }

  // 6. Seed Manufacturing Orders (2 completed, 2 in progress)
  console.log('\nChecking Manufacturing Orders...');
  const moCount = await prisma.manufacturingOrder.count({ where: { companyId } });
  if (moCount === 0) {
    // Completed MO 1
    const mo1 = await prisma.manufacturingOrder.create({
      data: {
        companyId,
        reference: 'OF-2026-0001',
        productId: pi001.id,
        formulaId: bom1.id,
        warehouseId: wh.id,
        status: 'COMPLETED',
        plannedQuantity: new Prisma.Decimal(50.0),
        producedQuantity: new Prisma.Decimal(50.0),
        unit: 'UNIT',
        plannedDate: new Date('2026-06-01T08:00:00Z'),
        startedAt: new Date('2026-06-01T08:30:00Z'),
        completedAt: new Date('2026-06-01T17:00:00Z'),
        totalEstimatedCost: new Prisma.Decimal(70000.00),
        totalActualCost: new Prisma.Decimal(71200.00),
        notes: 'Production conforme, rendement 100%',
        lines: {
          create: [
            {
              componentProductId: sv001.id,
              requiredQuantity: new Prisma.Decimal(10.0),
              consumedQuantity: new Prisma.Decimal(10.2),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.0),
              estimatedUnitCost: new Prisma.Decimal(190.00),
              estimatedLineCost: new Prisma.Decimal(1900.00)
            },
            {
              componentProductId: sv002.id,
              requiredQuantity: new Prisma.Decimal(5.0),
              consumedQuantity: new Prisma.Decimal(5.1),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.5),
              estimatedUnitCost: new Prisma.Decimal(270.00),
              estimatedLineCost: new Prisma.Decimal(1350.00)
            }
          ]
        }
      }
    });

    // Completed MO 2
    const mo2 = await prisma.manufacturingOrder.create({
      data: {
        companyId,
        reference: 'OF-2026-0002',
        productId: pi002.id,
        formulaId: bom2.id,
        warehouseId: wh.id,
        status: 'COMPLETED',
        plannedQuantity: new Prisma.Decimal(30.0),
        producedQuantity: new Prisma.Decimal(30.0),
        unit: 'UNIT',
        plannedDate: new Date('2026-06-05T08:00:00Z'),
        startedAt: new Date('2026-06-05T08:15:00Z'),
        completedAt: new Date('2026-06-05T15:45:00Z'),
        totalEstimatedCost: new Prisma.Decimal(46500.00),
        totalActualCost: new Prisma.Decimal(45200.00),
        notes: 'Production conforme, légères économies sur solvant',
        lines: {
          create: [
            {
              componentProductId: sv001.id,
              requiredQuantity: new Prisma.Decimal(7.5),
              consumedQuantity: new Prisma.Decimal(7.3),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.2),
              estimatedUnitCost: new Prisma.Decimal(190.00),
              estimatedLineCost: new Prisma.Decimal(1425.00)
            },
            {
              componentProductId: sv002.id,
              requiredQuantity: new Prisma.Decimal(4.5),
              consumedQuantity: new Prisma.Decimal(4.4),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.8),
              estimatedUnitCost: new Prisma.Decimal(270.00),
              estimatedLineCost: new Prisma.Decimal(1215.00)
            }
          ]
        }
      }
    });

    // In Progress MO 3
    const mo3 = await prisma.manufacturingOrder.create({
      data: {
        companyId,
        reference: 'OF-2026-0003',
        productId: pi001.id,
        formulaId: bom1.id,
        warehouseId: wh.id,
        status: 'IN_PROGRESS',
        plannedQuantity: new Prisma.Decimal(100.0),
        producedQuantity: new Prisma.Decimal(0.0),
        unit: 'UNIT',
        plannedDate: new Date('2026-06-15T08:00:00Z'),
        startedAt: new Date('2026-06-16T08:00:00Z'),
        totalEstimatedCost: new Prisma.Decimal(140000.00),
        notes: 'En cours de mélange',
        lines: {
          create: [
            {
              componentProductId: sv001.id,
              requiredQuantity: new Prisma.Decimal(20.0),
              consumedQuantity: new Prisma.Decimal(10.0), // partially consumed
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.0),
              estimatedUnitCost: new Prisma.Decimal(190.00),
              estimatedLineCost: new Prisma.Decimal(3800.00)
            },
            {
              componentProductId: sv002.id,
              requiredQuantity: new Prisma.Decimal(10.0),
              consumedQuantity: new Prisma.Decimal(5.0),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.5),
              estimatedUnitCost: new Prisma.Decimal(270.00),
              estimatedLineCost: new Prisma.Decimal(2700.00)
            }
          ]
        }
      }
    });

    // In Progress MO 4
    const mo4 = await prisma.manufacturingOrder.create({
      data: {
        companyId,
        reference: 'OF-2026-0004',
        productId: pi002.id,
        formulaId: bom2.id,
        warehouseId: wh.id,
        status: 'IN_PROGRESS',
        plannedQuantity: new Prisma.Decimal(40.0),
        producedQuantity: new Prisma.Decimal(0.0),
        unit: 'UNIT',
        plannedDate: new Date('2026-06-18T08:00:00Z'),
        startedAt: new Date('2026-06-16T09:30:00Z'),
        totalEstimatedCost: new Prisma.Decimal(62000.00),
        notes: 'Préparation des cuves',
        lines: {
          create: [
            {
              componentProductId: sv001.id,
              requiredQuantity: new Prisma.Decimal(10.0),
              consumedQuantity: new Prisma.Decimal(0.0),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.2),
              estimatedUnitCost: new Prisma.Decimal(190.00),
              estimatedLineCost: new Prisma.Decimal(1900.00)
            },
            {
              componentProductId: sv002.id,
              requiredQuantity: new Prisma.Decimal(6.0),
              consumedQuantity: new Prisma.Decimal(0.0),
              unit: 'L',
              wastagePercent: new Prisma.Decimal(1.8),
              estimatedUnitCost: new Prisma.Decimal(270.00),
              estimatedLineCost: new Prisma.Decimal(1620.00)
            }
          ]
        }
      }
    });

    console.log('✓ Successfully seeded 4 Manufacturing Orders (2 completed, 2 in progress)');
  } else {
    console.log(`Manufacturing orders already seeded (${moCount} found). Skipping.`);
  }

  // 7. Seed Customer Interactions (2-3 per customer)
  console.log('\nChecking Customer Interactions...');
  const interactionCount = await prisma.customerInteraction.count({ where: { companyId } });
  if (interactionCount === 0) {
    const customers = await prisma.customer.findMany({ where: { companyId } });
    console.log(`Seeding interactions for ${customers.length} customers...`);
    
    const adminUser = await prisma.user.findFirst({ where: { email: 'aymenderouiche001@gmail.com' } });
    const userId = adminUser?.id || null;

    const subjects = [
      { type: 'CALL', direction: 'OUTBOUND', subject: 'Prise de contact commerciale', content: 'Discussion sur les nouveaux produits de la gamme Peintures Intérieures. Client intéressé par un devis.' },
      { type: 'EMAIL', direction: 'INBOUND', subject: 'Demande de catalogue et tarifs', content: 'Le client demande la dernière version du catalogue des articles avec la grille tarifaire à jour.' },
      { type: 'MEETING', direction: 'OUTBOUND', subject: 'Négociation conditions de crédit', content: 'Rencontre au siège pour discuter de l\'augmentation de la limite de crédit à 500 000 DA.' },
      { type: 'CALL', direction: 'INBOUND', subject: 'Question sur livraison en cours', content: 'Appel du client pour suivre le statut de la livraison liée au Bon de Commande. Livré l\'après-midi.' },
      { type: 'NOTE', direction: 'OUTBOUND', subject: 'Relance facture en attente', content: 'Relance téléphonique pour le paiement de la facture échue. Promesse de virement sous 48h.' },
    ];

    for (const c of customers) {
      // Pick 2-3 random interaction definitions
      const numInteractions = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const shuffled = [...subjects].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numInteractions);

      for (let j = 0; j < selected.length; j++) {
        const item = selected[j];
        const randomDaysAgo = Math.floor(Math.random() * 20) + 1; // 1 to 20 days ago
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - randomDaysAgo);

        await prisma.customerInteraction.create({
          data: {
            companyId,
            customerId: c.id,
            type: item.type,
            direction: item.direction,
            subject: item.subject,
            content: item.content,
            durationMinutes: item.type === 'CALL' ? 5 : item.type === 'MEETING' ? 60 : null,
            status: 'COMPLETED',
            createdBy: userId,
            createdAt
          }
        });
      }
    }
    console.log(`✓ Seeded ${customers.length * 2.5} customer interactions successfully.`);
  } else {
    console.log(`Customer interactions already seeded (${interactionCount} found). Skipping.`);
  }

  console.log('\n--- SEEDING DONE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
