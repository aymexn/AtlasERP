import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class SalesOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.salesOrder.findMany({
      where: { companyId },
      include: { 
        customer: true,
        company: true,
        lines: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, companyId },
      include: { 
        customer: true,
        company: true, // Crucial for PDF Logo/Metadata
        lines: { 
          include: { 
            product: true 
          } 
        }
      },
    });
    if (!order) throw new NotFoundException('Sales Order not found');
    return order;
  }

  /**
   * EMERGENCY/PUBLIC ACCESS: Get order by ID only (for PDF rescue)
   * ID is a UUID, so it's reasonably secure for unauthenticated access.
   */
  async findOnePublic(id: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { 
        customer: true,
        company: true,
        lines: { include: { product: true } }
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(companyId: string, data: any) {
    const { customerId, lines, notes } = data;
    
    // 1. Calculate Totals
    let totalAmountHt = new Prisma.Decimal(0);
    let totalAmountTva = new Prisma.Decimal(0);

    const formattedLines = lines.map((l: any) => {
      const qty = new Prisma.Decimal(l.quantity || 0);
      const price = new Prisma.Decimal(l.unitPriceHt || 0);
      const taxRate = new Prisma.Decimal(l.taxRate || 0.19);
      
      const lineHt = qty.mul(price);
      const lineTva = lineHt.mul(taxRate);
      
      totalAmountHt = totalAmountHt.add(lineHt);
      totalAmountTva = totalAmountTva.add(lineTva);

      return {
        productId: l.productId,
        quantity: qty,
        unit: l.unit || 'pcs',
        unitPriceHt: price,
        unitCostSnapshot: 0, // Initial cost is 0, updated on shipment
        taxRate: taxRate,
        lineTotalHt: lineHt,
        lineTotalTtc: lineHt.add(lineTva),
      };
    });

    const totalAmountTtc = totalAmountHt.add(totalAmountTva);

    // 2. Generate Reference
    const count = await this.prisma.salesOrder.count({ where: { companyId } });
    const reference = `BC-CLI-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // 3. Persist
    return this.prisma.salesOrder.create({
      data: {
        reference,
        companyId,
        customerId,
        notes,
        totalAmountHt,
        totalAmountTva,
        totalAmountTtc,
        status: 'DRAFT',
        lines: {
          create: formattedLines,
        },
      },
      include: {
        customer: true,
        lines: true
      }
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

  async validateOrder(companyId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, companyId }
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be validated');

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'VALIDATED' }
    });
  }

  async cancelOrder(companyId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, companyId }
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'SHIPPED' || order.status === 'INVOICED') {
      throw new BadRequestException('Cannot cancel a shipped or invoiced order');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
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
