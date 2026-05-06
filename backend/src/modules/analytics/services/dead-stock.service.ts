import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DeadStockService {
  private readonly logger = new Logger(DeadStockService.name);

  constructor(private prisma: PrismaService) {}

  async identifyDeadStock(companyId: string, daysThreshold = 90) {
    this.logger.log(`Identifying dead stock for company ${companyId} with threshold of ${daysThreshold} days`);

    // 1. Get all products with current stock
    const productsWithStock = await this.prisma.productStock.findMany({
      where: {
        companyId,
        quantity: { gt: 0 }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            standardCost: true
          }
        }
      }
    });

    const deadStockItems = [];

    for (const item of productsWithStock) {
      // Get last sale date
      const lastSale = await this.prisma.salesOrderLine.findFirst({
        where: {
          productId: item.productId,
          salesOrder: {
            companyId,
            status: { notIn: ['CANCELLED', 'DRAFT'] }
          }
        },
        orderBy: { salesOrder: { date: 'desc' } },
        select: { salesOrder: { select: { date: true } } }
      });

      // Get last purchase date
      const lastPurchase = await this.prisma.stockReceptionLine.findFirst({
        where: {
          productId: item.productId,
          reception: {
            companyId,
            status: 'VALIDATED'
          }
        },
        orderBy: { reception: { receivedAt: 'desc' } },
        select: { reception: { select: { receivedAt: true } } }
      });

      const lastSaleDate = lastSale?.salesOrder?.date || null;
      const lastPurchaseDate = lastPurchase?.reception?.receivedAt || null;

      const now = new Date();
      const daysWithoutSale = lastSaleDate 
        ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Never sold

      const daysSincePurchase = lastPurchaseDate
        ? Math.floor((now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Never purchased (initial stock?)

      if (daysWithoutSale >= daysThreshold || !lastSaleDate) {
        let category = 'active';
        let reason = '';
        let actionRecommended = '';

        if (daysWithoutSale >= 365) {
          category = 'obsolete';
          reason = 'No sales in over a year';
          actionRecommended = 'dispose';
        } else if (daysWithoutSale >= 180) {
          category = 'dead_stock';
          reason = 'No sales in over 6 months';
          actionRecommended = 'return_to_supplier';
        } else if (daysWithoutSale >= 90) {
          category = 'slow_moving';
          reason = 'No sales in over 3 months';
          actionRecommended = 'discount';
        }

        if (category !== 'active') {
          deadStockItems.push({
            productId: item.productId,
            warehouseId: item.warehouseId,
            companyId,
            quantity: item.quantity,
            stockValue: item.quantity.mul(item.product.standardCost || 0),
            lastSaleDate,
            daysWithoutSale,
            lastPurchaseDate,
            daysSincePurchase,
            category,
            reason,
            actionRecommended
          });
        }
      }
    }

    // 2. Clear old records and save new ones
    await this.prisma.$transaction([
      this.prisma.deadStockItem.deleteMany({ where: { companyId } }),
      ...deadStockItems.map(item => this.prisma.deadStockItem.create({ data: item }))
    ]);

    return {
      success: true,
      summary: {
        totalItems: deadStockItems.length,
        totalValue: deadStockItems.reduce((sum, item) => sum + Number(item.stockValue), 0),
        byCategory: {
          slowMoving: deadStockItems.filter(i => i.category === 'slow_moving').length,
          deadStock: deadStockItems.filter(i => i.category === 'dead_stock').length,
          obsolete: deadStockItems.filter(i => i.category === 'obsolete').length
        }
      }
    };
  }

  async getReport(companyId: string, category?: string) {
    return this.prisma.deadStockItem.findMany({
      where: {
        companyId,
        ...(category ? { category } : {})
      },
      include: {
        product: { select: { name: true, sku: true, standardCost: true } },
        warehouse: { select: { name: true } }
      },
      orderBy: { stockValue: 'desc' }
    });
  }

  async markAction(itemId: string, action: string, userId: string) {
    return this.prisma.deadStockItem.update({
      where: { id: itemId },
      data: {
        actionTaken: action,
        actionDate: new Date(),
        actionBy: userId
      }
    });
  }
}
