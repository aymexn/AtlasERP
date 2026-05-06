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
var DeadStockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadStockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DeadStockService = DeadStockService_1 = class DeadStockService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DeadStockService_1.name);
    }
    async identifyDeadStock(companyId, daysThreshold = 90) {
        this.logger.log(`Identifying dead stock for company ${companyId} with threshold of ${daysThreshold} days`);
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
                : 999;
            const daysSincePurchase = lastPurchaseDate
                ? Math.floor((now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
                : 999;
            if (daysWithoutSale >= daysThreshold || !lastSaleDate) {
                let category = 'active';
                let reason = '';
                let actionRecommended = '';
                if (daysWithoutSale >= 365) {
                    category = 'obsolete';
                    reason = 'No sales in over a year';
                    actionRecommended = 'dispose';
                }
                else if (daysWithoutSale >= 180) {
                    category = 'dead_stock';
                    reason = 'No sales in over 6 months';
                    actionRecommended = 'return_to_supplier';
                }
                else if (daysWithoutSale >= 90) {
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
    async getReport(companyId, category) {
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
    async markAction(itemId, action, userId) {
        return this.prisma.deadStockItem.update({
            where: { id: itemId },
            data: {
                actionTaken: action,
                actionDate: new Date(),
                actionBy: userId
            }
        });
    }
};
exports.DeadStockService = DeadStockService;
exports.DeadStockService = DeadStockService = DeadStockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeadStockService);
//# sourceMappingURL=dead-stock.service.js.map