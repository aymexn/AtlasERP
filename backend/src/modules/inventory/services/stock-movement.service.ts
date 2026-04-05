import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockMovementDto, MovementType } from '../dto/create-movement.dto';

@Injectable()
export class StockMovementService {
  constructor(private prisma: PrismaService) {}

  async createMovement(companyId: string, userId: string, dto: CreateStockMovementDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, companyId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 1. Generate Reference if not provided
    const reference = dto.reference || await this.generateReference(companyId);

    const unitCost = dto.unitCost ?? Number(product.standardCost);
    const totalCost = dto.quantity * unitCost;

    return this.prisma.$transaction(async (tx) => {
      // 2. Business Logic & Stock Updates
      if (dto.type === MovementType.IN) {
        if (!dto.warehouseId) throw new BadRequestException('Warehouse ID is required for IN movement');
        await this.updateStock(tx, companyId, dto.productId, dto.warehouseId, dto.quantity);
        await tx.product.update({
          where: { id: dto.productId },
          data: { stockQuantity: { increment: dto.quantity } }
        });
      } 
      else if (dto.type === MovementType.OUT) {
        if (!dto.warehouseId) throw new BadRequestException('Warehouse ID is required for OUT movement');
        await this.updateStock(tx, companyId, dto.productId, dto.warehouseId, -dto.quantity);
        await tx.product.update({
          where: { id: dto.productId },
          data: { stockQuantity: { decrement: dto.quantity } }
        });
      } 
      else if (dto.type === MovementType.TRANSFER) {
        if (!dto.warehouseFromId || !dto.warehouseToId) {
          throw new BadRequestException('Source and Destination warehouses are required for TRANSFER');
        }
        await this.updateStock(tx, companyId, dto.productId, dto.warehouseFromId, -dto.quantity);
        await this.updateStock(tx, companyId, dto.productId, dto.warehouseToId, dto.quantity);
        // Total product stock doesn't change in a transfer
      } 
      else if (dto.type === MovementType.ADJUSTMENT) {
        if (!dto.warehouseId) throw new BadRequestException('Warehouse ID is required for ADJUSTMENT');
        
        const currentStock = await tx.productStock.findUnique({
          where: { productId_warehouseId_companyId: { productId: dto.productId, warehouseId: dto.warehouseId, companyId } }
        });
        
        const oldQty = currentStock ? Number(currentStock.quantity) : 0;
        const diff = dto.quantity - oldQty; // Assuming dto.quantity is the NEW value

        await this.updateStock(tx, companyId, dto.productId, dto.warehouseId, diff);
        await tx.product.update({
          where: { id: dto.productId },
          data: { stockQuantity: { increment: diff } }
        });
      }

      // 3. Create the movement record
      const movement = await tx.stockMovement.create({
        data: {
          reference,
          productId: dto.productId,
          type: dto.type as any,
          quantity: dto.quantity,
          unit: dto.unit,
          unitCost: unitCost,
          totalCost: totalCost,
          warehouseFromId: dto.warehouseFromId || (dto.type === MovementType.OUT || dto.type === MovementType.ADJUSTMENT ? dto.warehouseId : null),
          warehouseToId: dto.warehouseToId || (dto.type === MovementType.IN ? dto.warehouseId : null),
          reason: dto.reason,
          date: dto.date ? new Date(dto.date) : undefined,
          companyId: companyId,
          createdBy: userId,
        },
      });

      // 4. Update Product Total Value (Summary)
      const updatedProduct = await tx.product.findUnique({ where: { id: dto.productId } });
      if (updatedProduct) {
        await tx.product.update({
          where: { id: dto.productId },
          data: {
            stockValue: Number(updatedProduct.stockQuantity) * Number(updatedProduct.standardCost),
          },
        });
      }

      return movement;
    });
  }

  private async updateStock(tx: any, companyId: string, productId: string, warehouseId: string, delta: number) {
    const stock = await tx.productStock.findUnique({
      where: { productId_warehouseId_companyId: { productId, warehouseId, companyId } }
    });

    const newQty = (stock ? Number(stock.quantity) : 0) + delta;

    if (newQty < 0) {
      throw new BadRequestException('Stock insuffisant');
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

  private async generateReference(companyId: string): Promise<string> {
    const count = await this.prisma.stockMovement.count({
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
