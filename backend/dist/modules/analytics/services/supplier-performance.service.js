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
var SupplierPerformanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierPerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let SupplierPerformanceService = SupplierPerformanceService_1 = class SupplierPerformanceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SupplierPerformanceService_1.name);
    }
    async calculatePerformance(companyId, supplierId, startDate, endDate) {
        const orders = await this.prisma.purchaseOrder.findMany({
            where: {
                companyId,
                supplierId,
                orderDate: { gte: startDate, lte: endDate },
                status: 'RECEIVED'
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
                }
                else if (order.expectedDate) {
                    const delay = Math.ceil((reception.receivedAt.getTime() - order.expectedDate.getTime()) / (1000 * 60 * 60 * 24));
                    totalDelayDays += Math.max(0, delay);
                }
            }
        });
        const onTimeRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 100;
        const avgDelay = totalOrders > 0 ? totalDelayDays / totalOrders : 0;
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
        const qualityRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 100;
        const financialData = await this.prisma.purchaseOrder.aggregate({
            where: {
                companyId,
                supplierId,
                orderDate: { gte: startDate, lte: endDate }
            },
            _sum: { totalTtc: true },
            _avg: { totalTtc: true }
        });
        const overallScore = (onTimeRate * 0.5) + (qualityRate * 0.5);
        let grade = 'F';
        if (overallScore >= 90)
            grade = 'A';
        else if (overallScore >= 80)
            grade = 'B';
        else if (overallScore >= 70)
            grade = 'C';
        else if (overallScore >= 60)
            grade = 'D';
        let status = 'approved';
        if (grade === 'A')
            status = 'preferred';
        else if (grade === 'D' || grade === 'F')
            status = 'watch_list';
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
                averageDelayDays: new library_1.Decimal(avgDelay),
                onTimeDeliveryRate: new library_1.Decimal(onTimeRate),
                qualityAcceptanceRate: new library_1.Decimal(qualityRate),
                totalPurchaseValue: new library_1.Decimal(Number(financialData._sum.totalTtc || 0)),
                averageOrderValue: new library_1.Decimal(Number(financialData._avg.totalTtc || 0)),
                overallPerformanceScore: new library_1.Decimal(overallScore),
                performanceGrade: grade,
                recommendedStatus: status
            },
            update: {
                totalOrders,
                onTimeDeliveries,
                lateDeliveries: totalOrders - onTimeDeliveries,
                averageDelayDays: new library_1.Decimal(avgDelay),
                onTimeDeliveryRate: new library_1.Decimal(onTimeRate),
                qualityAcceptanceRate: new library_1.Decimal(qualityRate),
                totalPurchaseValue: new library_1.Decimal(Number(financialData._sum.totalTtc || 0)),
                averageOrderValue: new library_1.Decimal(Number(financialData._avg.totalTtc || 0)),
                overallPerformanceScore: new library_1.Decimal(overallScore),
                performanceGrade: grade,
                recommendedStatus: status,
                calculatedAt: new Date()
            }
        });
    }
    async getRankings(companyId, startDate, endDate) {
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
};
exports.SupplierPerformanceService = SupplierPerformanceService;
exports.SupplierPerformanceService = SupplierPerformanceService = SupplierPerformanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupplierPerformanceService);
//# sourceMappingURL=supplier-performance.service.js.map