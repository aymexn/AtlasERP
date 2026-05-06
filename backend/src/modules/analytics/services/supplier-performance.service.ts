import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SupplierPerformanceService {
  private readonly logger = new Logger(SupplierPerformanceService.name);

  constructor(private prisma: PrismaService) {}

  async calculatePerformance(companyId: string, supplierId: string, startDate: Date, endDate: Date) {
    // 1. Delivery Performance
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        companyId,
        supplierId,
        orderDate: { gte: startDate, lte: endDate },
        status: 'RECEIVED' // Or whatever status means it's closed
      },
      include: { stockReceptions: { where: { status: 'VALIDATED' } } }
    });

    const totalOrders = orders.length;
    let onTimeDeliveries = 0;
    let totalDelayDays = 0;

    orders.forEach(order => {
      const reception = order.stockReceptions[0];
      if (reception) {
        if (order.expectedDate && reception.receivedAt <= order.expectedDate) {
          onTimeDeliveries++;
        } else if (order.expectedDate) {
          const delay = Math.ceil((reception.receivedAt.getTime() - order.expectedDate.getTime()) / (1000 * 60 * 60 * 24));
          totalDelayDays += Math.max(0, delay);
        }
      }
    });

    const onTimeRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 100;
    const avgDelay = totalOrders > 0 ? totalDelayDays / totalOrders : 0;

    // 2. Quality Performance (Defective items)
    // In AtlasERP, we might not have a direct "defective" field yet, so we'll look at rejected items in receptions if any
    const receptionsData = await this.prisma.stockReceptionLine.aggregate({
      where: {
        reception: {
          companyId,
          purchaseOrder: { supplierId },
          receivedAt: { gte: startDate, lte: endDate },
          status: 'VALIDATED'
        }
      },
      _sum: { receivedQty: true, expectedQty: true }
    });

    const totalReceived = Number(receptionsData._sum.receivedQty || 0);
    const totalExpected = Number(receptionsData._sum.expectedQty || 0);
    // If received < expected, it might mean partial delivery or rejection
    const qualityRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 100;

    // 3. Financial Performance
    const financialData = await this.prisma.purchaseOrder.aggregate({
      where: {
        companyId,
        supplierId,
        orderDate: { gte: startDate, lte: endDate }
      },
      _sum: { totalTtc: true },
      _avg: { totalTtc: true }
    });

    // 4. Overall Score
    const overallScore = (onTimeRate * 0.5) + (qualityRate * 0.5); // Simplified weighted average
    
    let grade = 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';

    let status = 'approved';
    if (grade === 'A') status = 'preferred';
    else if (grade === 'D' || grade === 'F') status = 'watch_list';

    // 5. Save
    return this.prisma.supplierPerformanceMetric.upsert({
      where: {
        supplierId_periodStart_periodEnd_companyId: {
          supplierId,
          companyId,
          periodStart: startDate,
          periodEnd: endDate
        }
      },
      create: {
        supplierId,
        companyId,
        periodStart: startDate,
        periodEnd: endDate,
        totalOrders,
        onTimeDeliveries,
        lateDeliveries: totalOrders - onTimeDeliveries,
        averageDelayDays: new Decimal(avgDelay),
        onTimeDeliveryRate: new Decimal(onTimeRate),
        qualityAcceptanceRate: new Decimal(qualityRate),
        totalPurchaseValue: new Decimal(Number(financialData._sum.totalTtc || 0)),
        averageOrderValue: new Decimal(Number(financialData._avg.totalTtc || 0)),
        overallPerformanceScore: new Decimal(overallScore),
        performanceGrade: grade,
        recommendedStatus: status
      },
      update: {
        totalOrders,
        onTimeDeliveries,
        lateDeliveries: totalOrders - onTimeDeliveries,
        averageDelayDays: new Decimal(avgDelay),
        onTimeDeliveryRate: new Decimal(onTimeRate),
        qualityAcceptanceRate: new Decimal(qualityRate),
        totalPurchaseValue: new Decimal(Number(financialData._sum.totalTtc || 0)),
        averageOrderValue: new Decimal(Number(financialData._avg.totalTtc || 0)),
        overallPerformanceScore: new Decimal(overallScore),
        performanceGrade: grade,
        recommendedStatus: status,
        calculatedAt: new Date()
      }
    });
  }

  async getRankings(companyId: string, startDate: Date, endDate: Date) {
    return this.prisma.supplierPerformanceMetric.findMany({
      where: {
        companyId,
        periodStart: startDate,
        periodEnd: endDate
      },
      include: {
        supplier: { select: { name: true, email: true, phone: true } }
      },
      orderBy: { overallPerformanceScore: 'desc' }
    });
  }
}
