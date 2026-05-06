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
var StockTurnoverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockTurnoverService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let StockTurnoverService = StockTurnoverService_1 = class StockTurnoverService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StockTurnoverService_1.name);
    }
    async calculateTurnover(companyId, productId, warehouseId, startDate, endDate) {
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
        const turnoverRatio = avgInv > 0 ? unitsSold / avgInv : 0;
        const daysToSell = turnoverRatio > 0 ? 365 / turnoverRatio : 0;
        const cogsData = await this.prisma.salesOrderLine.aggregate({
            where: {
                salesOrder: {
                    companyId,
                    date: { gte: startDate, lte: endDate },
                    status: { notIn: ['CANCELLED', 'DRAFT'] }
                },
                productId
            },
            _sum: { lineTotalHt: true }
        });
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { standardCost: true }
        });
        const avgInvValue = avgInv * Number(product?.standardCost || 0);
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
                beginningInventory: new library_1.Decimal(begInv),
                endingInventory: new library_1.Decimal(endInv),
                averageInventory: new library_1.Decimal(avgInv),
                unitsSold: new library_1.Decimal(unitsSold),
                turnoverRatio: new library_1.Decimal(turnoverRatio),
                daysToSell: new library_1.Decimal(daysToSell),
                costOfGoodsSold: new library_1.Decimal(Number(cogsData._sum.lineTotalHt || 0)),
                averageInventoryValue: new library_1.Decimal(avgInvValue)
            },
            update: {
                beginningInventory: new library_1.Decimal(begInv),
                endingInventory: new library_1.Decimal(endInv),
                averageInventory: new library_1.Decimal(avgInv),
                unitsSold: new library_1.Decimal(unitsSold),
                turnoverRatio: new library_1.Decimal(turnoverRatio),
                daysToSell: new library_1.Decimal(daysToSell),
                costOfGoodsSold: new library_1.Decimal(Number(cogsData._sum.lineTotalHt || 0)),
                averageInventoryValue: new library_1.Decimal(avgInvValue)
            }
        });
    }
    async getAllAnalytics(companyId, startDate, endDate, limit = 100) {
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
};
exports.StockTurnoverService = StockTurnoverService;
exports.StockTurnoverService = StockTurnoverService = StockTurnoverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockTurnoverService);
//# sourceMappingURL=stock-turnover.service.js.map