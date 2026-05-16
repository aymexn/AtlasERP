import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getProductsStock(companyId: string, warehouseId?: string) {
    if (warehouseId) {
      const stocks = await this.prisma.productStock.findMany({
        where: { companyId, warehouseId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              standardCost: true,
              unit: true,
              minStock: true,
              family: { select: { name: true } }
            }
          }
        }
      });

      // Calculate reserved quantities for all products in this warehouse
      const reserved = await this.prisma.manufacturingOrderLine.groupBy({
        by: ['componentProductId'],
        where: {
          manufacturingOrder: {
            companyId,
            warehouseId,
            status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
          }
        },
        _sum: {
          requiredQuantity: true
        }
      });

      const reservedMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));

      return stocks.map(s => {
        const physical = Number(s.quantity);
        const res = reservedMap.get(s.productId) || 0;
        return {
          ...s,
          quantity: physical,
          stockQuantity: physical, // Add for consistency with global view
          minStock: Number(s.product.minStock), // Use product threshold
          reservedQuantity: res,
          availableQuantity: Math.max(0, physical - res)
        };
      });
    }

    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStock: true,
        maxStock: true,
        unit: true,
        stockValue: true,
        standardCost: true,
        purchasePriceHt: true,
        family: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Also calculate global reserved quantities for the global view
    const globalReserved = await this.prisma.manufacturingOrderLine.groupBy({
      by: ['componentProductId'],
      where: {
        manufacturingOrder: {
          companyId,
          status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] as any }
        }
      },
      _sum: {
        requiredQuantity: true
      }
    });

    const globalReservedMap = new Map(globalReserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));

    return products.map(p => {
      const physical = Number(p.stockQuantity);
      const res = globalReservedMap.get(p.id) || 0;
      return {
        ...p,
        stockQuantity: physical,
        reservedQuantity: res,
        availableQuantity: Math.max(0, physical - res)
      };
    });
  }


  async getInventorySummary(companyId: string) {
    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: {
        stockQuantity: true,
        stockValue: true,
        minStock: true,
        standardCost: true,
        purchasePriceHt: true,
      },
    });

    const totalItems = products.filter(p => Number(p.stockQuantity) > 0).length;
    const totalStockValue = products.reduce((sum, p) => {
      const cost = Number(p.purchasePriceHt || p.standardCost || 0);
      return sum + (Number(p.stockQuantity) * cost);
    }, 0);
    const lowStockAlerts = products.filter(p => Number(p.stockQuantity) > 0 && Number(p.stockQuantity) <= Number(p.minStock)).length;
    const outOfStock = products.filter(p => Number(p.stockQuantity) <= 0).length;

    return {
      totalItems,
      totalStockValue,
      lowStockAlerts,
      outOfStock,
    };
  }

  async getLowStockAlerts(companyId: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        stockQuantity: {
          lte: this.prisma.product.fields.minStock
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStock: true,
        unit: true
      }
    });
  }
}
