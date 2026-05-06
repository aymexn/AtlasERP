import prisma from '@/lib/prisma';
import { MovementType } from '@prisma/client';

export const StockMovementService = {
  /**
   * Core function to create a stock movement and update product stock levels.
   * Runs within a transaction if 'tx' is provided.
   */
  async createMovement(params: {
    productId: string;
    companyId: string;
    quantity: number;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
    reference: string;
    reason: string;
    warehouseId?: string;
    unitCost?: number;
    userId?: string;
    date?: Date;
  }, tx?: any) {
    const client = tx || prisma;
    const { productId, companyId, quantity, movementType, reference, reason, warehouseId, unitCost, userId, date } = params;

    return await client.$transaction(async (innerTx: any) => {
      // 1. Get product current state
      const product = await innerTx.product.findUnique({
        where: { id: productId, companyId },
        select: { stockQuantity: true, standardCost: true, unit: true }
      });

      if (!product) throw new Error(`Product not found: ${productId}`);

      const currentStock = Number(product.stockQuantity);
      const newStock = movementType === 'IN' ? currentStock + quantity : currentStock - quantity;

      // 2. Prevent negative stock if required (assume default true for safety)
      if (newStock < 0 && movementType === 'OUT') {
        throw new Error(`Insufficient stock for product ${productId}. Current: ${currentStock}, Requested: ${quantity}`);
      }

      // 3. Create StockMovement record
      const movement = await innerTx.stockMovement.create({
        data: {
          productId,
          companyId,
          quantity: movementType === 'OUT' ? -quantity : quantity,
          movementType,
          type: movementType === 'IN' ? 'IN' : 'OUT', // Fallback for enum
          reference,
          reason,
          unitCost: unitCost || Number(product.standardCost),
          totalCost: (unitCost || Number(product.standardCost)) * quantity,
          unit: product.unit,
          createdBy: userId,
          date: date || new Date(),
          warehouseToId: movementType === 'IN' ? warehouseId : null,
          warehouseFromId: movementType === 'OUT' ? warehouseId : null,
        }
      });

      // 4. Update Product stock level
      await innerTx.product.update({
        where: { id: productId },
        data: { 
          stockQuantity: newStock,
          stockValue: newStock * Number(product.standardCost)
        }
      });

      // 5. Update Warehouse Stock (ProductStock model)
      if (warehouseId) {
        const productStock = await innerTx.productStock.findUnique({
          where: { productId_warehouseId_companyId: { productId, warehouseId, companyId } }
        });

        if (productStock) {
          await innerTx.productStock.update({
            where: { id: productStock.id },
            data: { quantity: Number(productStock.quantity) + (movementType === 'IN' ? quantity : -quantity) }
          });
        } else {
          await innerTx.productStock.create({
            data: {
              productId,
              warehouseId,
              companyId,
              quantity: movementType === 'IN' ? quantity : -quantity
            }
          });
        }
      }

      return movement;
    });
  },

  /**
   * Validates a reception and creates IN movements for all lines.
   */
  async validateReception(receptionId: string) {
    const reception = await prisma.stockReception.findUnique({
      where: { id: receptionId },
      include: { lines: true, company: true }
    });

    if (!reception) throw new Error('Reception not found');
    if (reception.status === 'VALIDATED') throw new Error('Reception already validated');

    return await prisma.$transaction(async (tx) => {
      for (const line of reception.lines) {
        await this.createMovement({
          productId: line.productId,
          companyId: reception.companyId,
          quantity: Number(line.receivedQty),
          movementType: 'IN',
          reference: reception.reference,
          reason: `Reception Validation: ${reception.reference}`,
          warehouseId: reception.warehouseId,
          unitCost: Number(line.unitCost)
        }, tx);
      }

      // Mark reception as validated
      await tx.stockReception.update({
        where: { id: receptionId },
        data: { 
          status: 'VALIDATED',
          validatedAt: new Date()
        }
      });

      return { success: true };
    });
  },

  /**
   * Completes a sales order and creates OUT movements for all lines.
   */
  async completeSalesOrder(salesOrderId: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { lines: { include: { product: true } } }
    });

    if (!order) throw new Error('Sales order not found');
    if (order.status === 'SHIPPED') throw new Error('Order already shipped');

    return await prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        await this.createMovement({
          productId: line.productId,
          companyId: order.companyId,
          quantity: Number(line.quantity),
          movementType: 'OUT',
          reference: order.reference,
          reason: `Sales Order Completion: ${order.reference}`,
          unitCost: Number(line.product.standardCost)
        }, tx);
      }

      await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: { 
          status: 'SHIPPED',
          completedAt: new Date()
        }
      });

      return { success: true };
    });
  },

  /**
   * Completes a manufacturing order:
   * 1. Consumes raw materials per BOM
   * 2. Produces finished goods
   * 3. Calculates production cost and updates product standard cost
   */
  async completeManufacturingOrder(moId: string) {
    const mo = await prisma.manufacturingOrder.findUnique({
      where: { id: moId },
      include: { 
        product: true,
        lines: { include: { component: true } }
      }
    });

    if (!mo) throw new Error('Manufacturing order not found');
    if (mo.status === 'COMPLETED') throw new Error('MO already completed');

    return await prisma.$transaction(async (tx) => {
      let totalActualCost = 0;

      // 1. Consume Raw Materials (OUT)
      for (const line of mo.lines) {
        const qty = Number(line.requiredQuantity);
        const unitCost = Number(line.component.standardCost || 0);
        const lineCost = qty * unitCost;
        totalActualCost += lineCost;

        await this.createMovement({
          productId: line.componentProductId,
          companyId: mo.companyId,
          quantity: qty,
          movementType: 'OUT',
          reference: mo.reference,
          reason: `MO Consumption: ${mo.reference}`,
          unitCost: unitCost
        }, tx);
      }

      // 2. Produce Finished Goods (IN)
      const producedQty = Number(mo.plannedQuantity);
      const actualUnitCost = producedQty > 0 ? totalActualCost / producedQty : 0;

      await this.createMovement({
        productId: mo.productId,
        companyId: mo.companyId,
        quantity: producedQty,
        movementType: 'IN',
        reference: mo.reference,
        reason: `MO Production: ${mo.reference}`,
        unitCost: actualUnitCost
      }, tx);

      // 3. Update MO Status and Costs
      await tx.manufacturingOrder.update({
        where: { id: moId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          producedQuantity: producedQty,
          totalActualCost: totalActualCost
        }
      });

      // 4. Update Product Standard Cost (Revaluation)
      await tx.product.update({
        where: { id: mo.productId },
        data: { standardCost: actualUnitCost }
      });

      return { success: true, actualUnitCost };
    });
  },

  /**
   * Get movement history for a product.
   */
  async getProductMovements(productId: string) {
    return await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
      take: 50
    });
  }
};
