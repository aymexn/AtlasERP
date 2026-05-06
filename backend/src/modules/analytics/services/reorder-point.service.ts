import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReorderPointService {
  private readonly logger = new Logger(ReorderPointService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate optimal reorder point
   * Formula: Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
   * Safety Stock = Z-score × √(Lead Time) × Demand Std Dev
   */
  async calculateReorderPoint(companyId: string, productId: string, warehouseId: string | null, serviceLevelPercent = 95) {
    // 1. Get historical demand data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const sales = await this.prisma.salesOrderLine.findMany({
      where: {
        productId,
        salesOrder: {
          companyId,
          date: { gte: ninetyDaysAgo },
          status: { notIn: ['CANCELLED', 'DRAFT'] },
          ...(warehouseId ? { stockMovements: { some: { warehouseFromId: warehouseId } } } : {})
        }
      },
      select: {
        quantity: true,
        salesOrder: { select: { date: true } }
      }
    });

    // Group by day
    const dailyDemand: Record<string, number> = {};
    sales.forEach(sale => {
      const dateKey = sale.salesOrder.date.toISOString().split('T')[0];
      dailyDemand[dateKey] = (dailyDemand[dateKey] || 0) + Number(sale.quantity);
    });

    const demands = Object.values(dailyDemand);
    const avgDailyDemand = demands.length > 0 ? demands.reduce((a, b) => a + b, 0) / 90 : 0; // Avg over 90 days

    // Variance and Std Dev
    const variance = demands.length > 0 
      ? demands.reduce((sum, d) => sum + Math.pow(d - avgDailyDemand, 2), 0) / 90
      : 0;
    const stdDev = Math.sqrt(variance);

    // 2. Get lead time from purchase history
    const receptions = await this.prisma.stockReception.findMany({
      where: {
        companyId,
        purchaseOrder: { lines: { some: { productId } } },
        status: 'VALIDATED'
      },
      include: { purchaseOrder: true },
      orderBy: { receivedAt: 'desc' },
      take: 5
    });

    let leadTimeDays = 7; // Default
    if (receptions.length > 0) {
      const totalLeadTime = receptions.reduce((sum, rec) => {
        const orderDate = rec.purchaseOrder.orderDate;
        const receivedDate = rec.receivedAt;
        return sum + Math.ceil((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      leadTimeDays = Math.max(1, Math.ceil(totalLeadTime / receptions.length));
    }

    // 3. Z-score (95% = 1.65)
    const zScores: Record<number, number> = { 90: 1.28, 95: 1.65, 97: 1.88, 99: 2.33 };
    const zScore = zScores[serviceLevelPercent] || 1.65;

    // 4. Calculate metrics
    const safetyStock = Math.ceil(zScore * Math.sqrt(leadTimeDays) * stdDev);
    const reorderPoint = Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock);
    const reorderQuantity = Math.ceil(avgDailyDemand * 30); // 1 month supply
    const maximumStock = reorderPoint + reorderQuantity;
    const alertThreshold = Math.ceil(reorderPoint * 1.2);

    // 5. Save
    return this.prisma.reorderPoint.upsert({
      where: {
        productId_warehouseId_companyId: {
          productId,
          warehouseId,
          companyId
        }
      },
      create: {
        productId,
        warehouseId,
        companyId,
        reorderPoint: new Decimal(reorderPoint),
        safetyStock: new Decimal(safetyStock),
        reorderQuantity: new Decimal(reorderQuantity),
        maximumStock: new Decimal(maximumStock),
        leadTimeDays,
        averageDailyDemand: new Decimal(avgDailyDemand),
        demandVariability: new Decimal(stdDev),
        serviceLevel: new Decimal(serviceLevelPercent),
        calculationMethod: 'dynamic',
        lastCalculatedAt: new Date(),
        alertThreshold: new Decimal(alertThreshold)
      },
      update: {
        reorderPoint: new Decimal(reorderPoint),
        safetyStock: new Decimal(safetyStock),
        reorderQuantity: new Decimal(reorderQuantity),
        maximumStock: new Decimal(maximumStock),
        leadTimeDays,
        averageDailyDemand: new Decimal(avgDailyDemand),
        demandVariability: new Decimal(stdDev),
        serviceLevel: new Decimal(serviceLevelPercent),
        lastCalculatedAt: new Date(),
        alertThreshold: new Decimal(alertThreshold)
      }
    });
  }

  async getAlerts(companyId: string) {
    // This is complex in Prisma because we need to compare current stock with reorder point
    // We'll use raw SQL or a combination of queries
    return this.prisma.$queryRaw`
      SELECT 
        p.id, p.name, p.sku,
        COALESCE(ps.quantity, 0) as current_stock,
        rp.reorder_point,
        rp.safety_stock,
        rp.reorder_quantity,
        w.name as warehouse_name,
        CASE 
          WHEN COALESCE(ps.quantity, 0) <= rp.safety_stock THEN 'Critical'
          WHEN COALESCE(ps.quantity, 0) <= rp.reorder_point THEN 'Low'
          ELSE 'Normal'
        END as stock_status
      FROM reorder_points rp
      JOIN products p ON rp.product_id = p.id
      LEFT JOIN product_stocks ps ON p.id = ps.product_id AND (rp.warehouse_id = ps.warehouse_id OR rp.warehouse_id IS NULL)
      LEFT JOIN warehouses w ON rp.warehouse_id = w.id
      WHERE rp.company_id = ${companyId}::uuid
        AND rp.alert_enabled = true
        AND COALESCE(ps.quantity, 0) <= COALESCE(rp.alert_threshold, rp.reorder_point)
      ORDER BY 
        CASE 
          WHEN COALESCE(ps.quantity, 0) <= rp.safety_stock THEN 1
          WHEN COALESCE(ps.quantity, 0) <= rp.reorder_point THEN 2
          ELSE 3
        END,
        COALESCE(ps.quantity, 0) ASC
    `;
  }
}
