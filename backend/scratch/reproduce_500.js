const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduce() {
    console.log('--- Attempting to reproduce Reception Validation 500 Error ---');
    
    // Use the ID from the screenshot: fd768105-4022-47ab-9afa-82c6241413ce
    const receptionId = 'fd768105-4022-47ab-9afa-82c6241413ce';
    const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306'; // Assuming this company
    const userId = 'a7771803-e00d-4313-90b8-0dc645b63306'; // Just a dummy ID for user

    try {
        const reception = await prisma.stockReception.findFirst({
            where: { id: receptionId },
            include: { lines: true, purchaseOrder: true }
        });

        if (!reception) {
            console.error('Reception not found in DB!');
            return;
        }

        console.log(`Found reception ${reception.reference}. Status: ${reception.status}`);
        
        // Manual validation steps (reproducing service logic)
        await prisma.$transaction(async (tx) => {
            for (const line of reception.lines) {
                console.log(`Processing line for product ${line.productId}, quantity ${line.receivedQty}`);
                
                // 1. Create Stock Movement
                const product = await tx.product.findUnique({
                    where: { id: line.productId }
                });
                if (!product) throw new Error(`Product ${line.productId} not found`);

                // Simulate StockMovementService.createMovement logic
                const finalQuantity = Number(line.receivedQty);
                
                // Update product stock
                await tx.product.update({
                    where: { id: line.productId },
                    data: { stockQuantity: { increment: finalQuantity } }
                });

                // Update product warehouse stock
                const stock = await tx.productStock.findUnique({
                    where: { 
                        productId_warehouseId_companyId_variantId: { 
                            productId: line.productId, 
                            warehouseId: reception.warehouseId, 
                            companyId: reception.companyId,
                            variantId: line.variantId || null
                        } 
                    }
                });

                if (stock) {
                    await tx.productStock.update({
                        where: { id: stock.id },
                        data: { quantity: { increment: finalQuantity } }
                    });
                } else {
                    await tx.productStock.create({
                        data: {
                            productId: line.productId,
                            warehouseId: reception.warehouseId,
                            companyId: reception.companyId,
                            quantity: finalQuantity,
                            variantId: line.variantId || null
                        }
                    });
                }

                // Update PO line
                await tx.purchaseOrderLine.update({
                    where: { id: line.purchaseLineId },
                    data: { receivedQty: { increment: finalQuantity } }
                });
            }

            // Mark reception as validated
            await tx.stockReception.update({
                where: { id: receptionId },
                data: { 
                    status: 'VALIDATED',
                    validatedAt: new Date()
                }
            });
            
            console.log('Transaction success!');
        });
    } catch (err) {
        console.error('REPRODUCTION FAILED WITH ERROR:', err);
    }
}

reproduce().finally(() => prisma.$disconnect());
