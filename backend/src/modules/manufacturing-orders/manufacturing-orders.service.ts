import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManufacturingOrderDto, UpdateManufacturingOrderDto, CompleteManufacturingOrderDto } from './dto/manufacturing-order.dto';
import { StockMovementService } from '../inventory/services/stock-movement.service';
import { ManufacturingOrderStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ManufacturingOrdersService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService,
    private eventEmitter: EventEmitter2,
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

    const formula = await this.prisma.billOfMaterials.findFirst({
      where: { id: createDto.formulaId, companyId, productId: createDto.productId },
      include: {
        components: {
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

    const orderLines = formula.components.map(line => {
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
        bomComponentId: line.id,
        requiredQuantity: requiredQty,
        unit: line.unit,
        uomId: line.uomId,
        variantId: line.variantId,
        wastagePercent: line.wastagePercent,
        estimatedUnitCost: unitCost,
        estimatedLineCost: estimatedLineCost
      };
    });

    const order = await this.prisma.manufacturingOrder.create({
      data: {
        companyId,
        reference: this.generateReference(),
        productId: createDto.productId,
        variantId: createDto.variantId,
        formulaId: createDto.formulaId,
        plannedQuantity: plannedQty,
        unit: formula.outputUnit,
        plannedDate: new Date(createDto.plannedDate),
        notes: createDto.notes,
        warehouseId: createDto.warehouseId,
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

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return order;
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
    // Using a more robust check that respects the warehouse assignment
    // Optimization: Group by warehouse to fetch stock maps efficiently
    // Optimization: Group by product to fetch global aggregate stock maps efficiently
    const productIds = [...new Set(orders.flatMap(o => o.lines.map(l => l.componentProductId)))];
    
    // Total physical stock across all warehouses
    const allStocks = await this.prisma.productStock.groupBy({
      by: ['productId'],
      where: { companyId, productId: { in: productIds } },
      _sum: { quantity: true }
    });
    
    // Total reserved across all warehouses
    const allReserved = await this.prisma.manufacturingOrderLine.groupBy({
      by: ['componentProductId'],
      where: {
        manufacturingOrder: {
          companyId,
          status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
        }
      },
      _sum: { requiredQuantity: true }
    });

    const physicalMap = new Map(allStocks.map(s => [s.productId, Number(s._sum.quantity || 0)]));
    const reservedMap = new Map(allReserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
    const aggregateAvailMap = new Map<string, number>();
    
    productIds.forEach(pid => {
      const physical = physicalMap.get(pid) || 0;
      const reserved = reservedMap.get(pid) || 0;
      aggregateAvailMap.set(pid, Math.max(0, physical - reserved));
    });

    const enrichedOrders = [];
    
    for (const order of orders) {
      const orderJson = JSON.parse(JSON.stringify(order));
      let blockingShortage = false;
      let partialShortage = false;
      
      for (const line of orderJson.lines) {
        const available = aggregateAvailMap.get(line.componentProductId) || 0;

        const required = Number(line.requiredQuantity);
        
        if (available <= 0 && required > 0) {
          blockingShortage = true;
        } else if (available < required) {
          partialShortage = true;
        }
      }
      
      if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
        orderJson.stockReadiness = 'EXECUTED';
      } else if (blockingShortage) {
        orderJson.stockReadiness = 'BLOCKING';
      } else if (partialShortage) {
        orderJson.stockReadiness = 'PARTIAL';
      } else {
        orderJson.stockReadiness = 'READY';
      }
      
      enrichedOrders.push(orderJson);
    }
    
    return enrichedOrders;
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId },
      include: {
        product: true,
        formula: true,
        warehouse: true,
        lines: {
          include: { component: true }
        }
      }
    });

    if (!order) throw new NotFoundException('Manufacturing order not found');

    const orderWithStock = JSON.parse(JSON.stringify(order));
    
    // Resolve Warehouse for consistent stock checking
    let targetWarehouseId = order.warehouseId;
    let resolvedWarehouse = order.warehouse;

    if (!targetWarehouseId) {
        const warehouse = await this.prisma.warehouse.findFirst({
            where: { companyId, isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        targetWarehouseId = warehouse?.id || null;
        resolvedWarehouse = warehouse;
    }

    orderWithStock.warehouse = resolvedWarehouse;

    // Fetch AGGREGATE available stock map (all warehouses)
    const productIds = order.lines.map(l => l.componentProductId);
    const stocks = await this.prisma.productStock.groupBy({
        by: ['productId'],
        where: { companyId, productId: { in: productIds } },
        _sum: { quantity: true }
    });
    const reserved = await this.prisma.manufacturingOrderLine.groupBy({
        by: ['componentProductId'],
        where: {
          manufacturingOrder: {
            companyId,
            status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
          },
          NOT: { manufacturingOrderId: id }
        },
        _sum: { requiredQuantity: true }
    });
    const physicalMap = new Map(stocks.map(s => [s.productId, Number(s._sum.quantity || 0)]));
    const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
    const availMap = new Map<string, number>();
    productIds.forEach(pid => availMap.set(pid, Math.max(0, (physicalMap.get(pid) || 0) - (resMap.get(pid) || 0))));

    for (const line of orderWithStock.lines) {
      const currentStock = availMap.get(line.componentProductId) || 0;
      
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

    const result = await this.prisma.$transaction(async (tx) => {
      // Re-verify stock before planning
      await this.checkStockAvailability(tx, companyId, order.id, order.warehouseId);

      return await tx.manufacturingOrder.update({
        where: { id },
        data: { status: 'PLANNED' }
      });
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  private async checkStockAvailability(tx: Prisma.TransactionClient, companyId: string, orderId: string, warehouseId: string | null) {
    if (!warehouseId) {
      throw new BadRequestException('Warehouse must be assigned to validate stock.');
    }

    const order = await tx.manufacturingOrder.findUnique({
      where: { id: orderId },
      include: { lines: { include: { component: true } } }
    });

    if (!order) throw new NotFoundException('Manufacturing order not found');

    const productIds = order.lines.map(l => l.componentProductId);
    const stocks = await tx.productStock.groupBy({
        by: ['productId'],
        where: { companyId, productId: { in: productIds } },
        _sum: { quantity: true }
    });
    const reserved = await tx.manufacturingOrderLine.groupBy({
        by: ['componentProductId'],
        where: {
          manufacturingOrder: {
            companyId,
            status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
          },
          // Exclude the current order from reservation calculation to avoid self-blocking
          NOT: { manufacturingOrderId: orderId }
        },
        _sum: { requiredQuantity: true }
    });
    const physicalMap = new Map(stocks.map(s => [s.productId, Number(s._sum.quantity || 0)]));
    const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
    
    const shortages: any[] = [];
    for (const line of order.lines) {
      const physical = physicalMap.get(line.componentProductId) || 0;
      const res = resMap.get(line.componentProductId) || 0;
      const available = Math.max(0, physical - res);
      const required = Number(line.requiredQuantity);

      if (available < required) {
        shortages.push({
          product: line.component.name,
          required,
          available,
          deficit: required - available
        });
      }
    }

    if (shortages.length > 0) {
      const detailMsg = shortages.map(s => `${s.product} (Req: ${s.required}, Avail: ${s.available})`).join(', ');
      throw new BadRequestException({
        message: `Stock total insuffisant (tous entrepôts confondus).`,
        details: shortages,
        error: 'INSUFFICIENT_STOCK'
      });
    }
  }

  async start(companyId: string, userId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId }
    });
    
    if (!order) throw new NotFoundException('Manufacturing order not found');
    if (order.status === 'IN_PROGRESS') return order;
    
    // Strict transition: DRAFT or PLANNED -> IN_PROGRESS
    if (!['PLANNED', 'DRAFT'].includes(order.status)) {
      throw new BadRequestException(`Cannot start production from ${order.status} status.`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // SAFETY CHECK: Verify AVAILABLE stock BEFORE starting (Physical - Reserved)
      await this.checkStockAvailability(tx, companyId, order.id, order.warehouseId);

      // Start marks as IN_PROGRESS, stock is moved at COMPLETE for atomic pivot
      return await tx.manufacturingOrder.update({
        where: { id },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async complete(companyId: string, userId: string, id: string, dto: CompleteManufacturingOrderDto) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId },
      include: { 
        product: true,
        lines: { include: { component: true } }
      }
    });
    
    if (!order) throw new NotFoundException('Manufacturing order not found');
    if (order.status !== 'IN_PROGRESS') throw new BadRequestException('Order must be in IN_PROGRESS status to complete');

    // 1. Resolve Warehouse: Priority Order Warehouse > First Active Warehouse
    let warehouseId = order.warehouseId;
    
    if (!warehouseId) {
        const warehouse = await this.prisma.warehouse.findFirst({
            where: { companyId, isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        if (!warehouse) throw new BadRequestException('No active warehouse found for production.');
        warehouseId = warehouse.id;
    }

    // 2. Delegate ALL stock and cost logic to the automation service
    await this.stockMovementService.completeManufacturingOrder(companyId, userId, id, warehouseId, Number(dto.producedQuantity));

    // 2. Finalize any additional metadata
    const result = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { product: true, lines: true }
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async closeManufacturingOrder(companyId: string, userId: string, id: string, producedQuantity?: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.manufacturingOrder.findFirstOrThrow({
        where: { id, companyId },
        include: {
          lines: { include: { component: true } },
          product: true,
          warehouse: true,
        },
      });

      if (order.status === 'COMPLETED') {
        throw new BadRequestException('Cette commande est déjà terminée.');
      }

      // 1. Aggregate stock verification
      for (const line of order.lines) {
        const total = await tx.productStock.aggregate({
          _sum: { quantity: true },
          where: { productId: line.componentProductId, companyId },
        });
        const available = Number(total._sum.quantity || 0);
        
        const alreadyConsumed = await tx.stockMovement.aggregate({
          _sum: { quantity: true },
          where: {
            productId: line.componentProductId,
            reference: `MO-CONS-${order.reference}`,
            type: 'MFG_CONSUMPTION' as any,
            companyId
          },
        });
        const consumed = Math.abs(Number(alreadyConsumed._sum.quantity || 0));
        const needed = Number(line.requiredQuantity) - consumed;

        if (needed > 0 && available < needed) {
          throw new BadRequestException(
            `Stock insuffisant pour ${line.component.name} : besoin ${needed}, disponible ${available}`
          );
        }
      }

      // 2. Consume raw materials from any warehouse
      for (const line of order.lines) {
        const alreadyConsumed = await tx.stockMovement.aggregate({
          _sum: { quantity: true },
          where: {
            productId: line.componentProductId,
            reference: `MO-CONS-${order.reference}`,
            type: 'MFG_CONSUMPTION' as any,
            companyId
          },
        });
        const consumed = Math.abs(Number(alreadyConsumed._sum.quantity || 0));
        const toConsume = Number(line.requiredQuantity) - consumed;
        if (toConsume <= 0) continue;

        const stocks = await tx.productStock.findMany({
          where: { productId: line.componentProductId, companyId, quantity: { gt: 0 } },
          orderBy: { quantity: 'desc' },
        });

        let remaining = toConsume;
        for (const stock of stocks) {
          if (remaining <= 0) break;
          const deduct = Math.min(Number(stock.quantity), remaining);
          
          await tx.productStock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: deduct } }
          });

          await tx.product.update({
              where: { id: line.componentProductId },
              data: { stockQuantity: { decrement: deduct } }
          });

          const unitCost = Number(line.component.standardCost || line.component.purchasePriceHt || 0);

          await tx.stockMovement.create({
            data: {
              productId: line.componentProductId,
              warehouseToId: null,
              warehouseFromId: stock.warehouseId,
              type: 'MFG_CONSUMPTION' as any,
              quantity: -deduct,
              reference: `MO-CONS-${order.reference}`,
              createdBy: userId,
              companyId: companyId,
              unitCost,
              totalCost: deduct * unitCost,
              reason: `Consommation pour OF ${order.reference}`
            },
          });
          remaining -= deduct;
        }
        
        if (remaining > 0.001) {
          throw new Error(`Impossible de consommer tout le composant ${line.component.name}`);
        }

        await tx.manufacturingOrderLine.update({
            where: { id: line.id },
            data: { consumedQuantity: { increment: toConsume } }
        });
      }

      // 3. Produce finished good
      const destWarehouseId = order.warehouseId;
      if (!destWarehouseId) {
        throw new Error('Aucun entrepôt de destination défini');
      }

      const producedQty = producedQuantity !== undefined ? Number(producedQuantity) : Number(order.plannedQuantity);

      const stock = await tx.productStock.findFirst({
        where: {
          productId: order.productId,
          warehouseId: destWarehouseId,
          companyId,
          variantId: order.variantId || null
        }
      });

      if (stock) {
        await tx.productStock.update({
          where: { id: stock.id },
          data: { quantity: { increment: producedQty } }
        });
      } else {
        await tx.productStock.create({
          data: {
            productId: order.productId,
            warehouseId: destWarehouseId,
            companyId,
            quantity: producedQty,
            variantId: order.variantId || null
          }
        });
      }

      await tx.product.update({
          where: { id: order.productId },
          data: { stockQuantity: { increment: producedQty } }
      });

      const totalCostDecimal = order.lines.reduce((sum, line) => {
          const cost = Number(line.component.standardCost || line.component.purchasePriceHt || 0);
          return sum + (cost * Number(line.requiredQuantity));
      }, 0);

      const unitCost = producedQty > 0 ? totalCostDecimal / producedQty : 0;

      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          warehouseToId: destWarehouseId,
          warehouseFromId: null,
          type: 'MFG_OUTPUT' as any,
          quantity: producedQty,
          reference: `MO-PROD-${order.reference}`,
          createdBy: userId,
          companyId: companyId,
          unitCost,
          totalCost: totalCostDecimal,
          variantId: order.variantId,
          reason: `Production Output OF ${order.reference}`
        },
      });

      const completed = await tx.manufacturingOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          totalActualCost: totalCostDecimal,
          producedQuantity: producedQty,
          completedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          companyId: companyId,
          action: 'MANUFACTURING_ORDER_CLOSED',
          entity: 'ManufacturingOrder',
          entityId: order.id,
          description: `Clôture OF ${order.reference} – ${producedQty} unités de ${order.product.name} produites.`,
        },
      });

      return completed;
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async cancel(companyId: string, id: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
    if (!order) throw new NotFoundException('Manufacturing order not found');

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    // Advanced: If IN_PROGRESS, we may need to reverse the OUT stock movements.
    // For MVP ERP, we just mark as CANCELLED. Reversing is a complex topic.

    const result = await this.prisma.manufacturingOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async findForPdf(companyId: string | undefined, id: string) {
    const where: Prisma.ManufacturingOrderWhereInput = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const order = await this.prisma.manufacturingOrder.findFirst({
      where,
      include: {
        company: true,
        product: true,
        formula: true,
        lines: {
          include: { component: true }
        }
      }
    });

    if (!order) throw new NotFoundException('Manufacturing order not found');
    return order;
  }
}
