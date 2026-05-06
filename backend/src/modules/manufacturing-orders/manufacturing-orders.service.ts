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
    const warehouseIds = [...new Set(orders.map(o => o.warehouseId).filter(Boolean))];
    const warehouseStockMaps = new Map<string, Map<string, number>>();

    for (const wid of warehouseIds as string[]) {
      const stocks = await this.prisma.productStock.findMany({ where: { companyId, warehouseId: wid } });
      const reserved = await this.prisma.manufacturingOrderLine.groupBy({
        by: ['componentProductId'],
        where: {
          manufacturingOrder: {
            companyId,
            warehouseId: wid,
            status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
          }
        },
        _sum: { requiredQuantity: true }
      });
      const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
      const availMap = new Map<string, number>();
      stocks.forEach(s => availMap.set(s.productId, Math.max(0, Number(s.quantity) - (resMap.get(s.productId) || 0))));
      warehouseStockMaps.set(wid, availMap);
    }

    const enrichedOrders = [];
    
    for (const order of orders) {
      const orderJson = JSON.parse(JSON.stringify(order));
      let blockingShortage = false;
      let partialShortage = false;
      
      const targetWarehouseId = order.warehouseId;
      const stockMap = targetWarehouseId ? warehouseStockMaps.get(targetWarehouseId) : null;
      
      for (const line of orderJson.lines) {
        let available = 0;
        
        if (stockMap) {
          available = stockMap.get(line.componentProductId) || 0;
        } else {
          // Fallback if no warehouse assigned yet (use global available stock logic)
          available = Number(line.component.stockQuantity); // Could be refined to global available
        }

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

    // Fetch available stock map for the target warehouse
    const stocks = await this.prisma.productStock.findMany({ where: { companyId, warehouseId: targetWarehouseId } });
    const reserved = await this.prisma.manufacturingOrderLine.groupBy({
        by: ['componentProductId'],
        where: {
          manufacturingOrder: {
            companyId,
            warehouseId: targetWarehouseId,
            status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
          }
        },
        _sum: { requiredQuantity: true }
    });
    const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
    const availMap = new Map<string, number>();
    stocks.forEach(s => availMap.set(s.productId, Math.max(0, Number(s.quantity) - (resMap.get(s.productId) || 0))));

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
    
    // Strict transition: DRAFT or PLANNED -> IN_PROGRESS
    if (!['PLANNED', 'DRAFT'].includes(order.status)) {
      throw new BadRequestException(`Cannot start production from ${order.status} status.`);
    }

    // SAFETY CHECK: Verify AVAILABLE stock BEFORE starting (Physical - Reserved)
    const warehouseId = order.warehouseId;
    if (!warehouseId) throw new BadRequestException('Warehouse must be assigned to start production.');

    const stocks = await this.prisma.productStock.findMany({ where: { companyId, warehouseId } });
    const reserved = await this.prisma.manufacturingOrderLine.groupBy({
        by: ['componentProductId'],
        where: {
          manufacturingOrder: {
            companyId,
            warehouseId,
            status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
          }
        },
        _sum: { requiredQuantity: true }
    });
    const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
    
    const shortages: string[] = [];
    for (const line of order.lines) {
      const stock = stocks.find(s => s.productId === line.componentProductId);
      const physical = Number(stock?.quantity || 0);
      const res = resMap.get(line.componentProductId) || 0;
      const available = Math.max(0, physical - res);

      if (available < Number(line.requiredQuantity)) {
        shortages.push(`${line.component.name} (Required: ${line.requiredQuantity}, Available: ${available})`);
      }
    }

    if (shortages.length > 0) {
      throw new BadRequestException(`Impossible to start production. Missing components: ${shortages.join(', ')}`);
    }

    // Start only marks as IN_PROGRESS, stock is moved at COMPLETE for atomic pivot
    return await this.prisma.manufacturingOrder.update({
      where: { id },
      data: { 
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    });
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
    await this.stockMovementService.completeManufacturingOrder(companyId, userId, id, warehouseId);

    // 2. Finalize any additional metadata
    return await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { product: true, lines: true }
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
