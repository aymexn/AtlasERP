import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class SalesOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.salesOrder.findMany({
      where: { companyId },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, companyId },
      include: { 
        customer: true,
        lines: { include: { product: true } }
      },
    });
    if (!order) throw new NotFoundException('Sales Order not found');
    return order;
  }

  async create(companyId: string, data: any) {
    const { customerId, lines, ...rest } = data;
    
    const count = await this.prisma.salesOrder.count({ where: { companyId } });
    const reference = `BC-CLI-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    return this.prisma.salesOrder.create({
      data: {
        ...rest,
        reference,
        companyId,
        customer: { connect: { id: customerId } },
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            quantity: l.quantity,
            unit: l.unit,
            unitPriceHt: l.unitPriceHt,
            unitCostSnapshot: l.unitCostSnapshot || 0, // Will be updated on validation
            taxRate: l.taxRate || 0.19,
            lineTotalHt: new Prisma.Decimal(l.quantity).mul(new Prisma.Decimal(l.unitPriceHt)),
            lineTotalTtc: new Prisma.Decimal(l.quantity).mul(new Prisma.Decimal(l.unitPriceHt)).mul(1 + (l.taxRate || 0.19)),
          })),
        },
      },
    });
  }

  /**
   * ATOMIC SHIPMENT: Decreases stock and records profitability snapshot
   */
  async ship(companyId: string, userId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, companyId },
      include: { 
        lines: { include: { product: true } },
        company: true
      }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'SHIPPED') throw new BadRequestException('Order already shipped');

    return await this.prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        const prod = line.product;
        const shipQty = new Prisma.Decimal(line.quantity);
        const currentStock = new Prisma.Decimal(prod.stockQuantity);
        
        // 1. Stock availability check
        if (!order.company.allowNegativeStock && currentStock.lt(shipQty)) {
          throw new BadRequestException(`Insufficient stock for ${prod.name}. Available: ${currentStock}, Requested: ${shipQty}`);
        }

        const newStockQty = currentStock.minus(shipQty);
        const currentCost = new Prisma.Decimal(prod.standardCost || 0);

        // 2. Update Product Stock
        await tx.product.update({
          where: { id: prod.id },
          data: {
            stockQuantity: newStockQty,
            stockValue: newStockQty.mul(currentCost),
          }
        });

        // 3. Create Stock Movement (OUT)
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: prod.id,
            type: 'OUT',
            quantity: shipQty,
            unit: line.unit,
            unitCost: currentCost,
            totalCost: shipQty.mul(currentCost),
            reference: `EXP-CLI-${order.reference}`,
            reason: `Shipment for Sales Order ${order.reference}`,
            createdBy: userId,
            salesOrderId: order.id
          }
        });

        // 4. Update Line shipped quantity and snapshot cost for margin analysis
        await tx.salesOrderLine.update({
          where: { id: line.id },
          data: { 
            shippedQuantity: shipQty,
            unitCostSnapshot: currentCost // Lock production cost at moment of shipment
          }
        });
      }

      // 5. Update Order Status
      return tx.salesOrder.update({
        where: { id },
        data: { status: 'SHIPPED' }
      });
    });
  }

  async getProfitability(companyId: string, id: string) {
    const order = await this.findOne(companyId, id);
    
    const analysis = order.lines.map(line => {
      const revenue = new Prisma.Decimal(line.lineTotalHt);
      const cost = new Prisma.Decimal(line.quantity).mul(new Prisma.Decimal(line.unitCostSnapshot));
      const margin = revenue.minus(cost);
      const marginPercent = revenue.isZero() ? 0 : margin.div(revenue).mul(100).toNumber();

      return {
        product: line.product.name,
        quantity: line.quantity,
        revenue: revenue.toNumber(),
        cost: cost.toNumber(),
        margin: margin.toNumber(),
        marginPercent
      };
    });

    const totalRevenue = analysis.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCost = analysis.reduce((acc, curr) => acc + curr.cost, 0);
    const totalMargin = totalRevenue - totalCost;

    return {
      orderId: order.id,
      reference: order.reference,
      totalRevenue,
      totalCost,
      totalMargin,
      marginPercent: totalRevenue === 0 ? 0 : (totalMargin / totalRevenue) * 100,
      details: analysis
    };
  }
}
