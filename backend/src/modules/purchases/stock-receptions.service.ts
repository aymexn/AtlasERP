import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockReceptionDto } from './dto/stock-reception.dto';
import { MovementType } from '@prisma/client';

@Injectable()
export class StockReceptionsService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.stockReception.findMany({
      where: { companyId },
      include: {
        purchaseOrder: { include: { supplier: true } },
        warehouse: true,
        lines: { include: { product: true } },
        _count: { select: { lines: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }


  async findOne(id: string, companyId: string) {
    const reception = await this.prisma.stockReception.findFirst({
      where: { id, companyId },
      include: {
        purchaseOrder: { include: { supplier: true } },
        warehouse: true,
        lines: { include: { product: true } }
      }
    });

    if (!reception) {
      throw new NotFoundException(`Réception introuvable.`);
    }

    return reception;
  }

  async validate(id: string, companyId: string) {
    const reception = await this.prisma.stockReception.findFirst({
      where: { id, companyId },
      include: { lines: true, purchaseOrder: { include: { lines: true } } }
    });

    if (!reception) throw new NotFoundException('Réception introuvable.');
    if (reception.status === 'VALIDATED') throw new BadRequestException('Cette réception est déjà validée.');

    for (const line of reception.lines) {
      if (Number(line.receivedQty) <= 0) {
        throw new BadRequestException(`La quantité reçue pour le produit ID ${line.productId} doit être supérieure à zéro.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Process each line
      for (const line of reception.lines) {
        // Stock Movement IN
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: line.productId,
            warehouseToId: reception.warehouseId,
            type: MovementType.IN,
            quantity: line.receivedQty,
            unit: line.unit,
            unitCost: line.unitCost,
            totalCost: Number(line.receivedQty) * Number(line.unitCost),
            reference: `REC-${reception.reference}`,
            reason: `Réception BC ${reception.purchaseOrder.reference}`,
            date: new Date()
          }
        });

        // Upsert ProductStock (Warehouse level)
        const productStock = await tx.productStock.findFirst({
          where: { productId: line.productId, warehouseId: reception.warehouseId, companyId }
        });

        if (productStock) {
          await tx.productStock.update({
            where: { id: productStock.id },
            data: { quantity: { increment: line.receivedQty } }
          });
        } else {
          await tx.productStock.create({
            data: {
              companyId,
              productId: line.productId,
              warehouseId: reception.warehouseId,
              quantity: line.receivedQty
            }
          });
        }

        // Update Product total stock and latest purchase price
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stockQuantity: { increment: line.receivedQty },
            purchasePriceHt: line.unitCost
          }
        });

        // Update PurchaseOrderLine receivedQty
        if (line.purchaseLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: line.purchaseLineId },
            data: { receivedQty: { increment: line.receivedQty } }
          });
        }

        // Handle over-reception note if applicable
        if (Number(line.receivedQty) > Number(line.expectedQty)) {
          // Could update notes here, but schema has line.note. I'll just keep it.
        }
      }

      // 2. Recalculate PurchaseOrder status
      const updatedOrderLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: reception.purchaseOrderId }
      });

      let allReceived = true;
      let anyReceived = false;

      for (const ol of updatedOrderLines) {
        if (Number(ol.receivedQty) < Number(ol.quantity)) {
          allReceived = false;
        }
        if (Number(ol.receivedQty) > 0) {
          anyReceived = true;
        }
      }

      const newStatus = allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIALLY_RECEIVED' : 'CONFIRMED');

      await tx.purchaseOrder.update({
        where: { id: reception.purchaseOrderId },
        data: { status: newStatus }
      });

      // 3. Finalize reception
      return tx.stockReception.update({
        where: { id },
        data: { status: 'VALIDATED' },
        include: {
          purchaseOrder: { include: { supplier: true } },
          lines: { include: { product: true } }
        }
      });
    });
  }
}
