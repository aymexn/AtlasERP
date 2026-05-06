import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockMovementDto, MovementType } from '../dto/create-movement.dto';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../../notifications/notifications.service';

@Injectable()
export class StockMovementService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  /**
   * Core movement function. Supports existing transaction (tx) if provided.
   */
  async createMovement(companyId: string, userId: string | null, dto: CreateStockMovementDto, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;

    const product = await prisma.product.findUnique({
      where: { id: dto.productId, companyId },
    });

    if (!product) {
      throw new NotFoundException(`Produit introuvable : ${dto.productId}`);
    }

    const reference = dto.reference || await this.generateReference(companyId, tx);
    const unitCost = dto.unitCost ?? Number(product.standardCost);
    const totalCost = Number(dto.quantity) * unitCost;

    const executeWork = async (client: Prisma.TransactionClient) => {
      // 2. Business Logic & Stock Updates
      if (dto.type === MovementType.IN || dto.type === ('MFG_OUTPUT' as any)) {
        if (!dto.warehouseId) throw new BadRequestException('Warehouse ID is required for IN/MFG_OUTPUT');
        await this.updateStock(client, companyId, dto.productId, dto.warehouseId, dto.quantity);
        await client.product.update({
          where: { id: dto.productId },
          data: { stockQuantity: { increment: dto.quantity } }
        });
      } 
      else if (dto.type === MovementType.OUT || dto.type === ('MFG_CONSUMPTION' as any)) {
        if (!dto.warehouseId) throw new BadRequestException('Warehouse ID is required for OUT/MFG_CONSUMPTION');
        await this.updateStock(client, companyId, dto.productId, dto.warehouseId, -dto.quantity);
        const updatedProduct = await client.product.update({
          where: { id: dto.productId },
          data: { stockQuantity: { decrement: dto.quantity } }
        });

        // Trigger alert if stock is low
        if (updatedProduct.stockQuantity <= (updatedProduct.minStock || 0)) {
          // Fire and forget notification
          this.notificationService.notifyLowStock(updatedProduct, 'purchasing@atlas-erp.com').catch(console.error);
        }
      } 
      else if (dto.type === MovementType.TRANSFER) {
        if (!dto.warehouseFromId || !dto.warehouseToId) {
          throw new BadRequestException('Source and Destination warehouses are required for TRANSFER');
        }
        await this.updateStock(client, companyId, dto.productId, dto.warehouseFromId, -dto.quantity);
        await this.updateStock(client, companyId, dto.productId, dto.warehouseToId, dto.quantity);
        // Total product stock doesn't change in a transfer
      } 
      else if (dto.type === MovementType.ADJUSTMENT) {
        if (!dto.warehouseId) throw new BadRequestException('Warehouse ID is required for ADJUSTMENT');
        
        const currentStock = await client.productStock.findUnique({
          where: { productId_warehouseId_companyId: { productId: dto.productId, warehouseId: dto.warehouseId, companyId } }
        });
        
        const oldQty = currentStock ? Number(currentStock.quantity) : 0;
        const diff = Number(dto.quantity) - oldQty;

        await this.updateStock(client, companyId, dto.productId, dto.warehouseId, diff);
        await client.product.update({
          where: { id: dto.productId },
          data: { stockQuantity: { increment: diff } }
        });
      }

      // 3. Create the movement record
      const movement = await client.stockMovement.create({
        data: {
          reference,
          productId: dto.productId,
          movementType: dto.type as string,
          type: dto.type as any,
          quantity: dto.quantity,
          unit: dto.unit || product.unit,
          unitCost: unitCost,
          totalCost: totalCost,
          warehouseFromId: dto.warehouseFromId || ([MovementType.OUT, MovementType.ADJUSTMENT, 'MFG_CONSUMPTION'] as any[]).includes(dto.type) ? dto.warehouseId : null,
          warehouseToId: dto.warehouseToId || ([MovementType.IN, 'MFG_OUTPUT'] as any[]).includes(dto.type) ? dto.warehouseId : null,
          reason: dto.reason,
          date: dto.date ? new Date(dto.date) : new Date(),
          companyId: companyId,
          createdBy: userId,
        },
      });

      // 4. Update Product Total Value
      const updatedProduct = await client.product.findUnique({ where: { id: dto.productId } });
      if (updatedProduct) {
        await client.product.update({
          where: { id: dto.productId },
          data: {
            stockValue: Number(updatedProduct.stockQuantity) * Number(updatedProduct.standardCost),
          },
        });
      }

      return movement;
    };

    // Execute in existing OR new transaction
    if (tx) {
        return executeWork(tx);
    } else {
        return this.prisma.$transaction(async (newTx) => executeWork(newTx));
    }
  }

  /**
   * AUTOMATION: Validate Reception and create IN movements
   */
  async validateReception(companyId: string, userId: string, receptionId: string, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;
    const reception = await prisma.stockReception.findFirst({
      where: { id: receptionId, companyId },
      include: { lines: true, purchaseOrder: true }
    });

    if (!reception) throw new NotFoundException('Réception introuvable');
    if (reception.status === 'VALIDATED') throw new BadRequestException('Déjà validé');

    const executeWork = async (client: Prisma.TransactionClient) => {
      for (const line of reception.lines) {
        await this.createMovement(companyId, userId, {
          productId: line.productId,
          quantity: Number(line.receivedQty),
          type: MovementType.IN,
          warehouseId: reception.warehouseId,
          reference: `REC-${reception.reference}`,
          reason: `Réception BC ${reception.purchaseOrder.reference}`,
          unitCost: Number(line.unitCost),
          unit: line.unit
        }, client);
      }

      await client.stockReception.update({
        where: { id: receptionId },
        data: { status: 'VALIDATED' }
      });
    };

    if (tx) {
        return executeWork(tx);
    } else {
        return this.prisma.$transaction(async (newTx) => executeWork(newTx));
    }
  }

  /**
   * AUTOMATION: Complete Sales Order and create OUT movements
   */
  async completeSalesOrder(companyId: string, userId: string, orderId: string, warehouseId: string) {
     const order = await this.prisma.salesOrder.findFirst({
       where: { id: orderId, companyId },
       include: { lines: { include: { product: true } } }
     });

     if (!order) throw new NotFoundException('Vente introuvable');
     
     return this.prisma.$transaction(async (tx) => {
       for (const line of order.lines) {
         await this.createMovement(companyId, userId, {
           productId: line.productId,
           quantity: Number(line.quantity),
           type: MovementType.OUT,
           warehouseId: warehouseId,
           reference: `SO-${order.reference}`,
           reason: `Vente Client ${order.reference}`,
           unitCost: Number(line.product.standardCost),
           unit: line.unit
         }, tx);
       }
       
       await tx.salesOrder.update({
         where: { id: orderId },
         data: { status: 'SHIPPED' } // Aligning with SalesOrderStatus enum
       });
     });
  }

  /**
   * AUTOMATION: Complete MO (Pivot: OUT Components -> IN Finished Product)
   */
  async completeManufacturingOrder(companyId: string, userId: string, moId: string, warehouseId: string) {
    const mo = await this.prisma.manufacturingOrder.findFirst({
        where: { id: moId, companyId },
        include: { 
            product: true,
            lines: { include: { component: true } } 
        }
    });

    if (!mo) throw new NotFoundException('OF introuvable');
    if (mo.status === 'COMPLETED') throw new BadRequestException('Déjà terminé');

    return this.prisma.$transaction(async (tx) => {
        let totalCost = new Prisma.Decimal(0);

        // 0. Final Stock Verification inside Transaction (Locking check)
        const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } });
        
        for (const line of mo.lines) {
            const stock = await tx.productStock.findUnique({
                where: {
                    productId_warehouseId_companyId: {
                        productId: line.componentProductId,
                        warehouseId: warehouseId,
                        companyId: companyId
                    }
                }
            });

            const required = Number(line.requiredQuantity);
            const available = Number(stock?.quantity || 0);

            if (available < required) {
                throw new BadRequestException(
                    `Stock insuffisant pour [${line.component.name}] dans l'entrepôt [${warehouse?.name || 'Inconnu'}]. ` +
                    `Requis: ${required.toLocaleString()}, Disponible: ${available.toLocaleString()}.`
                );
            }
        }

        // 1. Consume RAW MATERIALS (OUT)
        for (const line of mo.lines) {
            const qty = Number(line.requiredQuantity);
            const unitCost = Number(line.component.standardCost || line.component.purchasePriceHt || 0);
            
            await this.createMovement(companyId, userId, {
                productId: line.componentProductId,
                quantity: qty,
                type: 'MFG_CONSUMPTION' as any,
                warehouseId: warehouseId,
                reference: `MO-CONS-${mo.reference}`,
                reason: `Consommation pour OF ${mo.reference}`,
                unitCost: unitCost,
                unit: line.unit
            }, tx);

            totalCost = totalCost.add(qty * unitCost);
        }

        // 2. Produce FINISHED PRODUCT (IN)
        const producedQty = Number(mo.plannedQuantity);
        const actualUnitCost = producedQty > 0 ? totalCost.dividedBy(producedQty).toNumber() : 0;

        await this.createMovement(companyId, userId, {
            productId: mo.productId,
            quantity: producedQty,
            type: 'MFG_OUTPUT' as any,
            warehouseId: warehouseId,
            reference: `MO-PROD-${mo.reference}`,
            reason: `Production Output OF ${mo.reference}`,
            unitCost: actualUnitCost,
            unit: mo.unit
        }, tx);

        // 3. Update MO Status
        await tx.manufacturingOrder.update({
            where: { id: moId },
            data: { 
                status: 'COMPLETED',
                completedAt: new Date(),
                producedQuantity: producedQty,
                totalActualCost: totalCost
            }
        });

        // 4. Update Product Standard Cost (Revaluation)
        await tx.product.update({
            where: { id: mo.productId },
            data: { standardCost: actualUnitCost }
        });

        // 5. Audit Log
        await tx.auditLog.create({
            data: {
                userId,
                companyId,
                action: 'MANUFACTURING_ORDER_CLOSED',
                entity: 'ManufacturingOrder',
                entityId: mo.id,
                description: `Production finalisée: ${producedQty} de ${mo.product.name} (Réf: ${mo.reference}). Coût unitaire: ${actualUnitCost.toFixed(2)}.`
            }
        });

        return mo;
    });
  }

  private async updateStock(tx: Prisma.TransactionClient, companyId: string, productId: string, warehouseId: string, delta: number) {
    const stock = await tx.productStock.findUnique({
      where: { productId_warehouseId_companyId: { productId, warehouseId, companyId } }
    });

    const newQty = (stock ? Number(stock.quantity) : 0) + delta;

    // Optional: Global check if company allows negative stock
    const company = await tx.company.findUnique({ where: { id: companyId }, select: { allowNegativeStock: true } });
    if (!company?.allowNegativeStock && newQty < 0) {
      const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true } });
      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } });
      throw new BadRequestException(
        `Stock insuffisant pour [${product?.name || 'Produit inconnu'}] dans l'entrepôt [${warehouse?.name || 'Entrepôt sélectionné'}]. ` +
        `Requis: ${Math.abs(delta)}, Disponible: ${stock ? stock.quantity : 0}`
      );
    }

    if (stock) {
      await tx.productStock.update({
        where: { id: stock.id },
        data: { quantity: newQty }
      });
    } else {
      await tx.productStock.create({
        data: {
          productId,
          warehouseId,
          companyId,
          quantity: newQty
        }
      });
    }
  }

  private async generateReference(companyId: string, tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx || this.prisma;
    const count = await client.stockMovement.count({
      where: { companyId }
    });
    const nextNumber = count + 1;
    return `MVMT-${nextNumber.toString().padStart(4, '0')}`;
  }

  async getProductMovementHistory(productId: string, companyId: string) {
    return this.prisma.stockMovement.findMany({
      where: { productId, companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        warehouseFrom: { select: { name: true } },
        warehouseTo: { select: { name: true } },
      },
    });
  }

  async listMovements(companyId: string) {
    return this.prisma.stockMovement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { email: true } },
        warehouseFrom: { select: { name: true } },
        warehouseTo: { select: { name: true } },
      },
    });
  }
}
