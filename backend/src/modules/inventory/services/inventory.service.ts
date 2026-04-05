import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getProductsStock(companyId: string, warehouseId?: string) {
    if (warehouseId) {
      return this.prisma.productStock.findMany({
        where: { companyId, warehouseId },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              standardCost: true,
              unit: true,
              family: { select: { name: true } }
            }
          }
        }
      });
    }

    return this.prisma.product.findMany({
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
        family: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
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
      },
    });

    const totalItems = products.filter(p => Number(p.stockQuantity) > 0).length;
    const totalStockValue = products.reduce((sum, p) => sum + (Number(p.stockQuantity) * Number(p.standardCost)), 0);
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
