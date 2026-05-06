import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StockTurnoverService {
  private readonly logger = new Logger(StockTurnoverService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate stock turnover for a product
   * Formula: Turnover Ratio = Units Sold / Average Inventory
   * Days to Sell = 365 / Turnover Ratio
   */
  async calculateTurnover(companyId: string, productId: string, warehouseId: string | null, startDate: Date, endDate: Date) {
    // 1. Get beginning and ending inventory
    // Beginning inventory is the stock quantity at startDate
    const beginningStock = await this.prisma.stockMovement.aggregate({
      where: {
        companyId,
        productId,
        warehouseToId: warehouseId || undefined,
        date: { lte: startDate }
      },
      _sum: { quantity: true }
    });

    const endingStock = await this.prisma.stockMovement.aggregate({
      where: {
        companyId,
        productId,
        warehouseToId: warehouseId || undefined,
        date: { lte: endDate }
      },
      _sum: { quantity: true }
    });

    const begInv = Number(beginningStock._sum.quantity || 0);
    const endInv = Number(endingStock._sum.quantity || 0);
    const avgInv = (begInv + endInv) / 2;

    // 2. Get units sold
    const sales = await this.prisma.salesOrderLine.aggregate({
      where: {
        salesOrder: {
          companyId,
          date: { gte: startDate, lte: endDate },
          status: { notIn: ['CANCELLED', 'DRAFT'] }
        },
        productId
      },
      _sum: { quantity: true }
    });

    const unitsSold = Number(sales._sum.quantity || 0);

    // 3. Calculate turnover ratio
    const turnoverRatio = avgInv > 0 ? unitsSold / avgInv : 0;
    const daysToSell = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

    // 4. Get COGS
    const cogsData = await this.prisma.salesOrderLine.aggregate({
      where: {
        salesOrder: {
          companyId,
          date: { gte: startDate, lte: endDate },
          status: { notIn: ['CANCELLED', 'DRAFT'] }
        },
        productId
      },
      _sum: { lineTotalHt: true } // Simplified COGS: using revenue as proxy if cost is not available
    });

    // 5. Get avg inventory value
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { standardCost: true }
    });
    const avgInvValue = avgInv * Number(product?.standardCost || 0);

    // 6. Save to database
    return this.prisma.stockTurnoverAnalytics.upsert({
      where: {
        productId_warehouseId_periodStart_periodEnd_companyId: {
          productId,
          warehouseId,
          periodStart: startDate,
          periodEnd: endDate,
          companyId
        }
      },
      create: {
        productId,
        warehouseId,
        companyId,
        periodStart: startDate,
        periodEnd: endDate,
        beginningInventory: new Decimal(begInv),
        endingInventory: new Decimal(endInv),
        averageInventory: new Decimal(avgInv),
        unitsSold: new Decimal(unitsSold),
        turnoverRatio: new Decimal(turnoverRatio),
        daysToSell: new Decimal(daysToSell),
        costOfGoodsSold: new Decimal(Number(cogsData._sum.lineTotalHt || 0)),
        averageInventoryValue: new Decimal(avgInvValue)
      },
      update: {
        beginningInventory: new Decimal(begInv),
        endingInventory: new Decimal(endInv),
        averageInventory: new Decimal(avgInv),
        unitsSold: new Decimal(unitsSold),
        turnoverRatio: new Decimal(turnoverRatio),
        daysToSell: new Decimal(daysToSell),
        costOfGoodsSold: new Decimal(Number(cogsData._sum.lineTotalHt || 0)),
        averageInventoryValue: new Decimal(avgInvValue)
      }
    });
  }

  async getAllAnalytics(companyId: string, startDate: Date, endDate: Date, limit = 100) {
    return this.prisma.stockTurnoverAnalytics.findMany({
      where: {
        companyId,
        periodStart: startDate,
        periodEnd: endDate
      },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } }
      },
      orderBy: { turnoverRatio: 'asc' },
      take: limit
    });
  }
}
