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
var ReorderPointService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderPointService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let ReorderPointService = ReorderPointService_1 = class ReorderPointService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReorderPointService_1.name);
    }
    async calculateReorderPoint(companyId, productId, warehouseId, serviceLevelPercent = 95) {
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
        const dailyDemand = {};
        sales.forEach(sale => {
            const dateKey = sale.salesOrder.date.toISOString().split('T')[0];
            dailyDemand[dateKey] = (dailyDemand[dateKey] || 0) + Number(sale.quantity);
        });
        const demands = Object.values(dailyDemand);
        const avgDailyDemand = demands.length > 0 ? demands.reduce((a, b) => a + b, 0) / 90 : 0;
        const variance = demands.length > 0
            ? demands.reduce((sum, d) => sum + Math.pow(d - avgDailyDemand, 2), 0) / 90
            : 0;
        const stdDev = Math.sqrt(variance);
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
        let leadTimeDays = 7;
        if (receptions.length > 0) {
            const totalLeadTime = receptions.reduce((sum, rec) => {
                const orderDate = rec.purchaseOrder.orderDate;
                const receivedDate = rec.receivedAt;
                return sum + Math.ceil((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            }, 0);
            leadTimeDays = Math.max(1, Math.ceil(totalLeadTime / receptions.length));
        }
        const zScores = { 90: 1.28, 95: 1.65, 97: 1.88, 99: 2.33 };
        const zScore = zScores[serviceLevelPercent] || 1.65;
        const safetyStock = Math.ceil(zScore * Math.sqrt(leadTimeDays) * stdDev);
        const reorderPoint = Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock);
        const reorderQuantity = Math.ceil(avgDailyDemand * 30);
        const maximumStock = reorderPoint + reorderQuantity;
        const alertThreshold = Math.ceil(reorderPoint * 1.2);
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
                reorderPoint: new library_1.Decimal(reorderPoint),
                safetyStock: new library_1.Decimal(safetyStock),
                reorderQuantity: new library_1.Decimal(reorderQuantity),
                maximumStock: new library_1.Decimal(maximumStock),
                leadTimeDays,
                averageDailyDemand: new library_1.Decimal(avgDailyDemand),
                demandVariability: new library_1.Decimal(stdDev),
                serviceLevel: new library_1.Decimal(serviceLevelPercent),
                calculationMethod: 'dynamic',
                lastCalculatedAt: new Date(),
                alertThreshold: new library_1.Decimal(alertThreshold)
            },
            update: {
                reorderPoint: new library_1.Decimal(reorderPoint),
                safetyStock: new library_1.Decimal(safetyStock),
                reorderQuantity: new library_1.Decimal(reorderQuantity),
                maximumStock: new library_1.Decimal(maximumStock),
                leadTimeDays,
                averageDailyDemand: new library_1.Decimal(avgDailyDemand),
                demandVariability: new library_1.Decimal(stdDev),
                serviceLevel: new library_1.Decimal(serviceLevelPercent),
                lastCalculatedAt: new Date(),
                alertThreshold: new library_1.Decimal(alertThreshold)
            }
        });
    }
    async getAlerts(companyId) {
        return this.prisma.$queryRaw `
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
};
exports.ReorderPointService = ReorderPointService;
exports.ReorderPointService = ReorderPointService = ReorderPointService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReorderPointService);
//# sourceMappingURL=reorder-point.service.js.map