"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProductsStock(companyId, warehouseId) {
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
            const reserved = await this.prisma.manufacturingOrderLine.groupBy({
                by: ['componentProductId'],
                where: {
                    manufacturingOrder: {
                        companyId,
                        warehouseId,
                        status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] }
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
                    stockQuantity: physical,
                    minStock: Number(s.product.minStock),
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
        const globalReserved = await this.prisma.manufacturingOrderLine.groupBy({
            by: ['componentProductId'],
            where: {
                manufacturingOrder: {
                    companyId,
                    status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] }
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
    async getInventorySummary(companyId) {
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
    async getLowStockAlerts(companyId) {
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map