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
exports.DashboardAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardAnalyticsService = class DashboardAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getKPIs(companyId, period = 'month') {
        const startDate = this.getStartDateForPeriod(period);
        const sales = await this.prisma.salesOrder.aggregate({
            _sum: { totalAmountTtc: true },
            where: {
                companyId,
                date: { gte: startDate },
                status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] }
            }
        });
        const revenue = Number(sales._sum.totalAmountTtc || 0);
        const prevStartDate = this.getStartDateForPeriod(period, 2);
        const prevSales = await this.prisma.salesOrder.aggregate({
            _sum: { totalAmountTtc: true },
            where: {
                companyId,
                date: { gte: prevStartDate, lt: startDate },
                status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] }
            }
        });
        const prevRevenue = Number(prevSales._sum.totalAmountTtc || 0);
        const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
        const salesHt = await this.prisma.salesOrder.aggregate({
            _sum: { totalAmountHt: true },
            where: {
                companyId,
                date: { gte: startDate },
                status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] }
            }
        });
        const revenueHt = Number(salesHt._sum.totalAmountHt || 0);
        const margin = revenueHt > 0 ? 32.5 : 0;
        const activeOrders = await this.prisma.salesOrder.count({
            where: {
                companyId,
                status: { in: ['VALIDATED', 'PREPARING', 'SHIPPED'] }
            }
        });
        const totalProducts = await this.prisma.product.count({ where: { companyId, isActive: true } });
        const outOfStock = await this.prisma.product.count({
            where: { companyId, isActive: true, stockQuantity: { lte: 0 } }
        });
        const stockOutRate = totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0;
        return {
            revenue,
            revenueChange,
            margin,
            activeOrders,
            stockOutRate
        };
    }
    async getImminentRupture(companyId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const lines = await this.prisma.salesOrderLine.findMany({
            where: {
                salesOrder: {
                    companyId,
                    date: { gte: thirtyDaysAgo },
                    status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] }
                }
            },
            select: { productId: true, quantity: true }
        });
        const velocityMap = new Map();
        for (const l of lines) {
            const current = velocityMap.get(l.productId) || 0;
            velocityMap.set(l.productId, current + Number(l.quantity));
        }
        const products = await this.prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                stockQuantity: { gt: 0 }
            },
            select: { id: true, name: true, sku: true, stockQuantity: true, unit: true }
        });
        const alerts = [];
        for (const p of products) {
            const totalSold30d = velocityMap.get(p.id) || 0;
            const dailyVelocity = totalSold30d / 30;
            if (dailyVelocity > 0) {
                const daysRemaining = Number(p.stockQuantity) / dailyVelocity;
                if (daysRemaining < 7) {
                    alerts.push({
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        stock: Number(p.stockQuantity),
                        unit: p.unit,
                        velocity: dailyVelocity.toFixed(2),
                        daysRemaining: Math.round(daysRemaining),
                        predictionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
                    });
                }
            }
        }
        return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }
    async getSurstock(companyId) {
        return [];
    }
    async getPaymentDelays(companyId) {
        return this.prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'PARTIAL'] },
                dueDate: { lt: new Date() }
            },
            include: { customer: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
            take: 10
        });
    }
    async getProductionBottlenecks(companyId) {
        const inProgressMOs = await this.prisma.manufacturingOrder.findMany({
            where: { companyId, status: 'IN_PROGRESS' },
            include: {
                lines: {
                    include: {
                        component: {
                            select: { name: true, stockQuantity: true, unit: true }
                        }
                    }
                }
            }
        });
        const bottlenecks = [];
        for (const mo of inProgressMOs) {
            for (const line of mo.lines) {
                const needed = Number(line.requiredQuantity) - Number(line.consumedQuantity || 0);
                const available = Number(line.component.stockQuantity);
                if (needed > available) {
                    bottlenecks.push({
                        moReference: mo.reference,
                        moId: mo.id,
                        componentName: line.component.name,
                        needed,
                        available,
                        unit: line.component.unit,
                        shortage: needed - available
                    });
                }
            }
        }
        return bottlenecks;
    }
    async getRevenueEvolution(companyId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const sales = await this.prisma.salesOrder.findMany({
            where: {
                companyId,
                date: { gte: startDate },
                status: { in: ['VALIDATED', 'SHIPPED', 'INVOICED'] }
            },
            select: { date: true, totalAmountTtc: true },
            orderBy: { date: 'asc' }
        });
        const result = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const dailyTotal = sales
                .filter(s => s.date.toISOString().split('T')[0] === dateStr)
                .reduce((sum, s) => sum + Number(s.totalAmountTtc), 0);
            result.push({ date: dateStr, amount: dailyTotal });
        }
        return result;
    }
    async getTopProducts(companyId, limit = 5) {
        const lines = await this.prisma.salesOrderLine.findMany({
            where: {
                salesOrder: {
                    companyId,
                    status: 'INVOICED'
                }
            },
            select: {
                productId: true,
                quantity: true,
                lineTotalTtc: true,
                product: { select: { name: true } }
            }
        });
        const aggregated = new Map();
        for (const l of lines) {
            const existing = aggregated.get(l.productId);
            if (existing) {
                existing.totalRevenue += Number(l.lineTotalTtc);
                existing.totalQuantity += Number(l.quantity);
            }
            else {
                aggregated.set(l.productId, {
                    name: l.product.name,
                    totalRevenue: Number(l.lineTotalTtc),
                    totalQuantity: Number(l.quantity)
                });
            }
        }
        return Array.from(aggregated.entries())
            .map(([productId, data]) => ({ productId, ...data }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
    }
    async getCategoryDistribution(companyId) {
        const families = await this.prisma.productFamily.findMany({
            where: { companyId },
            include: {
                products: {
                    include: {
                        salesOrderLines: {
                            where: { salesOrder: { status: 'INVOICED' } },
                            select: { lineTotalTtc: true }
                        }
                    }
                }
            }
        });
        return families.map(f => {
            const revenue = f.products.reduce((sum, p) => {
                return sum + p.salesOrderLines.reduce((s, l) => s + Number(l.lineTotalTtc), 0);
            }, 0);
            return { name: f.name, value: revenue };
        }).filter(f => f.value > 0);
    }
    async getRecentTransactions(companyId, limit = 10) {
        return this.prisma.stockMovement.findMany({
            where: { companyId },
            include: {
                product: { select: { name: true, unit: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    getStartDateForPeriod(period, multiplier = 1) {
        const d = new Date();
        switch (period) {
            case 'week':
                d.setDate(d.getDate() - (7 * multiplier));
                break;
            case 'month':
                d.setMonth(d.getMonth() - (1 * multiplier));
                break;
            case 'quarter':
                d.setMonth(d.getMonth() - (3 * multiplier));
                break;
            case 'year':
                d.setFullYear(d.getFullYear() - (1 * multiplier));
                break;
            default: d.setMonth(d.getMonth() - 1);
        }
        return d;
    }
};
exports.DashboardAnalyticsService = DashboardAnalyticsService;
exports.DashboardAnalyticsService = DashboardAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardAnalyticsService);
//# sourceMappingURL=dashboard-analytics.service.js.map