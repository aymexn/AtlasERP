import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManufacturingOrderDto, UpdateManufacturingOrderDto, CompleteManufacturingOrderDto } from './dto/manufacturing-order.dto';
import { StockMovementService } from '../inventory/services/stock-movement.service';
import { ManufacturingOrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class ManufacturingOrdersService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService,
  ) {}

  private generateReference(): string {
    const date = new Date();
    const prefix = 'MO';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Using a more standard format MO-YYYYMM-XXXX
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${year}${month}-${random}`;
  }

  async create(companyId: string, createDto: CreateManufacturingOrderDto) {
    // Verify product and formula exist
    const product = await this.prisma.product.findFirst({
      where: { id: createDto.productId, companyId }
    });
    if (!product) throw new NotFoundException('Product not found');

    const formula = await this.prisma.productFormula.findFirst({
      where: { id: createDto.formulaId, companyId, productId: createDto.productId },
      include: {
        lines: {
          include: { component: true }
        }
      }
    });
    if (!formula) throw new NotFoundException('Formula not found or does not belong to product');

    if (Number(createDto.plannedQuantity) <= 0) {
      throw new BadRequestException('Planned quantity must be greater than zero');
    }

    // Calculate required components
    const plannedQty = new Prisma.Decimal(createDto.plannedQuantity);
    const formulaOutput = formula.outputQuantity;
    const scaleFactor = plannedQty.dividedBy(formulaOutput);

    let totalEstimatedCost = new Prisma.Decimal(0);

    const orderLines = formula.lines.map(line => {
      const requiredQty = line.quantity.mul(scaleFactor);
      
      // Costing Priority: Standard Cost > Purchase Price > 0
      const standardCost = line.component.standardCost || new Prisma.Decimal(0);
      const purchasePrice = line.component.purchasePriceHt || new Prisma.Decimal(0);
      const unitCost = Number(standardCost) > 0 ? standardCost : 
                       (Number(purchasePrice) > 0 ? purchasePrice : new Prisma.Decimal(0));
      
      const estimatedLineCost = requiredQty.mul(unitCost);
      totalEstimatedCost = totalEstimatedCost.add(estimatedLineCost);

      return {
        componentProductId: line.componentProductId,
        formulaLineId: line.id,
        requiredQuantity: requiredQty,
        unit: line.unit,
        wastagePercent: line.wastagePercent,
        estimatedUnitCost: unitCost,
        estimatedLineCost: estimatedLineCost
      };
    });

    return this.prisma.manufacturingOrder.create({
      data: {
        companyId,
        reference: this.generateReference(),
        productId: createDto.productId,
        formulaId: createDto.formulaId,
        plannedQuantity: plannedQty,
        unit: formula.outputUnit,
        plannedDate: new Date(createDto.plannedDate),
        notes: createDto.notes,
        totalEstimatedCost,
        lines: {
          create: orderLines
        }
      },
      include: {
        product: true,
        formula: true,
        lines: {
          include: { component: true }
        }
      }
    });
  }

  async findAll(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) {
      where.status = status as ManufacturingOrderStatus;
    }
    
    const orders = await this.prisma.manufacturingOrder.findMany({
      where,
      include: {
        product: true,
        formula: true,
        lines: {
          include: { 
            component: {
              select: { stockQuantity: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add high-level availability summary for the cockpit
    return orders.map(order => {
      const orderJson = JSON.parse(JSON.stringify(order));
      let hasShortage = false;
      
      orderJson.lines.forEach((line: any) => {
        if (Number(line.component.stockQuantity) < Number(line.requiredQuantity)) {
          hasShortage = true;
        }
      });
      
      orderJson.stockReadiness = order.status !== 'DRAFT' && order.status !== 'PLANNED' ? 'EXECUTED' : (hasShortage ? 'SHORTAGE' : 'READY');
      return orderJson;
    });
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId },
      include: {
        product: true,
        formula: true,
        lines: {
          include: { component: true }
        }
      }
    });

    if (!order) throw new NotFoundException('Manufacturing order not found');

    const orderWithStock = JSON.parse(JSON.stringify(order));
    
    for (const line of orderWithStock.lines) {
      const stockRes = await this.prisma.product.findUnique({
        where: { id: line.componentProductId },
        select: { stockQuantity: true }
      });
      
      const currentStock = Number(stockRes?.stockQuantity || 0);
      const required = Number(line.requiredQuantity);
      
      line.availableStock = currentStock;
      line.shortageQuantity = Math.max(0, required - currentStock);
      
      if (currentStock >= required) {
        line.stockStatus = 'ENOUGH';
      } else if (currentStock > 0) {
        line.stockStatus = 'LOW';
      } else {
        line.stockStatus = 'INSUFFICIENT';
      }
    }

    return orderWithStock;
  }

  async update(companyId: string, id: string, updateDto: UpdateManufacturingOrderDto) {
    const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
    if (!order) throw new NotFoundException('Manufacturing order not found');

    if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(order.status)) {
       throw new BadRequestException(`Cannot update order in ${order.status} status`);
    }

    const data: any = {};
    if (updateDto.notes !== undefined) data.notes = updateDto.notes;
    if (updateDto.plannedDate) data.plannedDate = new Date(updateDto.plannedDate);

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data,
      include: { product: true }
    });
  }

  async plan(companyId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
    if (!order) throw new NotFoundException('Manufacturing order not found');

    if (order.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot plan order in ${order.status} status. It must be in DRAFT.`);
    }

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data: { status: 'PLANNED' }
    });
  }

  async start(companyId: string, userId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId },
      include: { lines: { include: { component: true } } }
    });
    
    if (!order) throw new NotFoundException('Manufacturing order not found');
    if (order.status === 'IN_PROGRESS') return order;
    
    if (!['PLANNED', 'DRAFT'].includes(order.status)) {
      throw new BadRequestException(`Cannot start production from ${order.status} status.`);
    }

    // SAFETY CHECK: Verify stock BEFORE starting
    const shortages: string[] = [];
    for (const line of order.lines) {
      if (Number(line.component.stockQuantity) < Number(line.requiredQuantity)) {
        shortages.push(`${line.component.name} (Required: ${line.requiredQuantity}, Available: ${line.component.stockQuantity})`);
      }
    }

    if (shortages.length > 0) {
      throw new BadRequestException(`Impossible to start production. Missing components: ${shortages.join(', ')}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.manufacturingOrder.update({
        where: { id },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });

      let totalActualCost = new Prisma.Decimal(0);

      for (const line of order.lines) {
        const requiredQty = Number(line.requiredQuantity);
        if (requiredQty > 0) {
          await tx.manufacturingOrderLine.update({
            where: { id: line.id },
            data: { consumedQuantity: line.requiredQuantity }
          });

          const comp = line.component;
          const unitCost = Number(comp.standardCost) > 0 ? Number(comp.standardCost) : 
                           (Number(comp.purchasePriceHt) > 0 ? Number(comp.purchasePriceHt) : 0);
          
          const currentStock = Number(comp.stockQuantity);
          const newStockQty = currentStock - requiredQty;
          const newStockVal = newStockQty * unitCost;

          await tx.product.update({
            where: { id: comp.id },
            data: {
              stockQuantity: newStockQty,
              stockValue: newStockVal
            }
          });

          await tx.stockMovement.create({
            data: {
              companyId,
              productId: comp.id,
              type: 'OUT',
              quantity: requiredQty,
              unit: line.unit,
              unitCost,
              totalCost: requiredQty * unitCost,
              reference: `MO-OUT-${order.reference}`,
              reason: `Consumption for Manufacturing Order ${order.reference}`,
              createdBy: userId,
              date: new Date()
            }
          });
          
          totalActualCost = totalActualCost.add(requiredQty * unitCost);
        }
      }

      return await tx.manufacturingOrder.update({
        where: { id },
        data: { totalActualCost }
      });
    });
  }

  async complete(companyId: string, userId: string, id: string, dto: CompleteManufacturingOrderDto) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId },
      include: { product: true }
    });
    
    if (!order) throw new NotFoundException('Manufacturing order not found');
    if (order.status !== 'IN_PROGRESS') throw new BadRequestException('Order must be in IN_PROGRESS status to complete');

    return await this.prisma.$transaction(async (tx) => {
      const producedQty = Number(dto.producedQuantity);
      
      // Update order status
      const updatedOrder = await tx.manufacturingOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          producedQuantity: producedQty
        }
      });

      if (producedQty > 0) {
        // Evaluate unit cost from actual material cost
        const actualMaterialCost = Number(order.totalActualCost || order.totalEstimatedCost);
        const unitCost = actualMaterialCost > 0 ? actualMaterialCost / producedQty : 0;

        // Update Finished Goods stock
        const currentStock = Number(order.product.stockQuantity);
        const newStockQty = currentStock + producedQty;
        // Optionally update the standard cost/value average depending on accounting standard
        // For now, simpler value addition
        const newStockVal = Number(order.product.stockValue) + actualMaterialCost;

        await tx.product.update({
          where: { id: order.productId },
          data: {
            stockQuantity: newStockQty,
            stockValue: newStockVal
          }
        });

        // Create IN movement for the finished product
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: order.productId,
            type: 'IN',
            quantity: producedQty,
            unit: order.unit,
            unitCost,
            totalCost: actualMaterialCost,
            reference: `MO-IN-${order.reference}`,
            reason: `Production output from Manufacturing Order ${order.reference}`,
            createdBy: userId,
            date: new Date()
          }
        });
      }

      return updatedOrder;
    });
  }

  async cancel(companyId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
    if (!order) throw new NotFoundException('Manufacturing order not found');

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    // Advanced: If IN_PROGRESS, we may need to reverse the OUT stock movements.
    // For MVP ERP, we just mark as CANCELLED. Reversing is a complex topic.

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }
}
