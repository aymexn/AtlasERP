const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306';
  const userId = '11111111-1111-1111-1111-111111111111';
  const receptionRef = 'REC-202605-0001';

  const reception = await prisma.stockReception.findFirst({
    where: { reference: receptionRef, companyId },
    include: { lines: true, purchaseOrder: true }
  });

  if (!reception) {
    console.log('Reception not found');
    return;
  }

  console.log(`Simulating FULL validation for ${reception.id}...`);

  try {
    await prisma.$transaction(async (tx) => {
      for (const line of reception.lines) {
        // 1. Create Stock Movement
        await tx.stockMovement.create({
          data: {
            reference: `REC-${reception.reference}`,
            productId: line.productId,
            movementType: 'IN',
            type: 'IN',
            quantity: Number(line.receivedQty),
            unit: line.unit,
            unitCost: Number(line.unitCost),
            totalCost: Number(line.receivedQty) * Number(line.unitCost),
            warehouseToId: reception.warehouseId,
            reason: `Réception BC ${reception.purchaseOrder.reference}`,
            companyId: companyId,
            createdBy: userId
          }
        });

        // 2. Update Purchase Order Line
        await tx.purchaseOrderLine.update({
          where: { id: line.purchaseLineId },
          data: {
            receivedQty: { increment: Number(line.receivedQty) }
          }
        });

        // 3. Update Product Stock (Upsert)
        await tx.productStock.upsert({
          where: {
            productId_warehouseId_companyId_variantId: {
                productId: line.productId,
                warehouseId: reception.warehouseId,
                companyId: companyId,
                variantId: line.variantId || null
            }
          },
          update: {
            quantity: { increment: Number(line.receivedQty) }
          },
          create: {
            productId: line.productId,
            warehouseId: reception.warehouseId,
            companyId: companyId,
            quantity: Number(line.receivedQty),
            variantId: line.variantId || null
          }
        });
        
        // 4. Update Product total stock
        await tx.product.update({
            where: { id: line.productId },
            data: { stockQuantity: { increment: Number(line.receivedQty) } }
        });
      }

      // 5. Mark reception as validated
      await tx.stockReception.update({
        where: { id: reception.id },
        data: { status: 'VALIDATED' }
      });

      // 6. Update PO Status
      const po = await tx.purchaseOrder.findUnique({
        where: { id: reception.purchaseOrderId },
        include: { lines: true }
      });

      if (po) {
        const allReceived = po.lines.every(l => Number(l.receivedQty) >= Number(l.quantity));
        const anyReceived = po.lines.some(l => Number(l.receivedQty) > 0);
        
        let newStatus = po.status;
        if (allReceived) {
          newStatus = 'FULLY_RECEIVED';
        } else if (anyReceived) {
          newStatus = 'PARTIALLY_RECEIVED';
        }

        if (newStatus !== po.status) {
          await tx.purchaseOrder.update({
            where: { id: po.id },
            data: { status: newStatus }
          });
          console.log(`PO status updated to ${newStatus}`);
        }
      }
    });
    console.log('Validation simulation successful');
  } catch (e) {
    console.error('Validation simulation failed:', e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
