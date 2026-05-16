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
var KpiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
let KpiService = KpiService_1 = class KpiService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(KpiService_1.name);
    }
    async handleDashboardRefresh(payload) {
        const metrics = payload.metrics || [
            'total_sales', 'revenue', 'cash_flow', 'inventory_value',
            'stock_alerts', 'active_purchase_orders', 'total_receptions',
            'validated_receptions', 'pending_receptions', 'active_employees',
            'pending_leaves', 'profitability', 'revenue_today', 'revenue_month'
        ];
        await this.recalculate(payload.companyId, metrics);
    }
    async recalculate(companyId, metrics) {
        this.logger.log(`Recalculating metrics for company ${companyId}: ${metrics.join(', ')}`);
        const calculators = {
            'total_sales': () => this.calculateTotalSales(companyId),
            'revenue': () => this.calculateRevenue(companyId),
            'cash_flow': () => this.calculateCashFlow(companyId),
            'inventory_value': () => this.calculateInventoryValue(companyId),
            'stock_alerts': () => this.calculateStockAlerts(companyId),
            'active_purchase_orders': () => this.calculateActivePurchaseOrders(companyId),
            'total_receptions': () => this.calculateTotalReceptions(companyId),
            'validated_receptions': () => this.calculateValidatedReceptions(companyId),
            'pending_receptions': () => this.calculatePendingReceptions(companyId),
            'active_employees': () => this.calculateActiveEmployees(companyId),
            'pending_leaves': () => this.calculatePendingLeaves(companyId),
            'profitability': () => this.calculateProfitability(companyId),
            'revenue_today': () => this.calculateRevenueToday(companyId),
            'revenue_month': () => this.calculateRevenueMonth(companyId),
            'health_score': () => this.calculateHealthScore(companyId),
            'production_stats': () => this.calculateProductionStats(companyId),
            'procurement_stats': () => this.calculateProcurementStats(companyId),
            'sales_stats': () => this.calculateSalesStats(companyId),
            'recent_activity': () => this.calculateRecentActivity(companyId),
        };
        for (const metric of metrics) {
            if (calculators[metric]) {
                try {
                    const result = await calculators[metric]();
                    await this.updateKpi(companyId, metric, result);
                }
                catch (error) {
                    this.logger.error(`Error calculating metric ${metric}: ${error.message}`);
                }
            }
        }
    }
    async updateKpi(companyId, metric, data) {
        const value = typeof data === 'number' ? data : (data.value ?? 0);
        const metadata = typeof data === 'object' ? (data.metadata ?? null) : null;
        const unit = typeof data === 'object' ? (data.unit ?? null) : null;
        await this.prisma.companyKpi.upsert({
            where: { companyId_metric: { companyId, metric } },
            update: { value, metadata, unit, updatedAt: new Date() },
            create: { companyId, metric, value, metadata, unit }
        });
    }
    async getAll(companyId) {
        const kpis = await this.prisma.companyKpi.findMany({
            where: { companyId }
        });
        return kpis.reduce((acc, kpi) => {
            acc[kpi.metric] = {
                value: kpi.value,
                metadata: kpi.metadata,
                unit: kpi.unit,
                updatedAt: kpi.updatedAt
            };
            return acc;
        }, {});
    }
    async calculateTotalSales(companyId) {
        return this.prisma.salesOrder.count({
            where: { companyId, status: { not: client_1.SalesOrderStatus.CANCELLED } }
        });
    }
    async calculateRevenue(companyId) {
        const result = await this.prisma.invoice.aggregate({
            where: {
                companyId,
                status: { in: [client_1.InvoiceStatus.PAID, client_1.InvoiceStatus.PARTIAL, client_1.InvoiceStatus.SENT, client_1.InvoiceStatus.OVERDUE] }
            },
            _sum: { totalAmountTtc: true }
        });
        return Number(result._sum.totalAmountTtc || 0);
    }
    async calculateRevenueToday(companyId) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const result = await this.prisma.invoice.aggregate({
            where: { companyId, date: { gte: start } },
            _sum: { totalAmountTtc: true }
        });
        return Number(result._sum.totalAmountTtc || 0);
    }
    async calculateRevenueMonth(companyId) {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        const result = await this.prisma.invoice.aggregate({
            where: { companyId, date: { gte: start } },
            _sum: { totalAmountTtc: true }
        });
        return Number(result._sum.totalAmountTtc || 0);
    }
    async calculateCashFlow(companyId) {
        const [received, expenses] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { companyId },
                _sum: { amount: true }
            }),
            this.prisma.expense.aggregate({
                where: { companyId },
                _sum: { amount: true }
            })
        ]);
        return Number(received._sum.amount || 0) - Number(expenses._sum.amount || 0);
    }
    async calculateInventoryValue(companyId) {
        const products = await this.prisma.product.findMany({
            where: { companyId, stockQuantity: { gt: 0 } },
            select: { stockQuantity: true, standardCost: true }
        });
        return products.reduce((total, p) => {
            return total + (Number(p.stockQuantity) * Number(p.standardCost || 0));
        }, 0);
    }
    async calculateStockAlerts(companyId) {
        const alerts = await this.prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                OR: [
                    { stockQuantity: { lte: 0 } },
                    {
                        AND: [
                            { minStock: { gt: 0 } },
                            { stockQuantity: { lte: this.prisma.product.fields.minStock } }
                        ]
                    }
                ]
            },
            select: { id: true, sku: true, name: true, stockQuantity: true, minStock: true, unit: true }
        });
        return {
            value: alerts.length,
            metadata: alerts.map(p => ({
                productId: p.id,
                sku: p.sku,
                name: p.name,
                currentStock: Number(p.stockQuantity),
                minLevel: Number(p.minStock),
                unit: p.unit,
                status: Number(p.stockQuantity) <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
            }))
        };
    }
    async calculateActivePurchaseOrders(companyId) {
        return this.prisma.purchaseOrder.count({
            where: {
                companyId,
                status: { notIn: [client_1.PurchaseOrderStatus.FULLY_RECEIVED, client_1.PurchaseOrderStatus.CANCELLED] }
            }
        });
    }
    async calculateTotalReceptions(companyId) {
        return this.prisma.stockReception.count({
            where: { companyId }
        });
    }
    async calculateValidatedReceptions(companyId) {
        return this.prisma.stockReception.count({
            where: { companyId, status: client_1.ReceptionStatus.VALIDATED }
        });
    }
    async calculatePendingReceptions(companyId) {
        return this.prisma.stockReception.count({
            where: { companyId, status: client_1.ReceptionStatus.DRAFT }
        });
    }
    async calculateActiveEmployees(companyId) {
        return this.prisma.employee.count({
            where: { companyId, status: client_1.EmployeeStatus.ACTIVE }
        });
    }
    async calculatePendingLeaves(companyId) {
        return this.prisma.leaveRequest.count({
            where: {
                employee: { companyId },
                status: client_1.LeaveStatus.PENDING
            }
        });
    }
    async calculateHealthScore(companyId) {
        const [cash, revenue, stockAlerts, pendingLeaves] = await Promise.all([
            this.calculateCashFlow(companyId),
            this.calculateRevenueToday(companyId),
            this.calculateStockAlerts(companyId),
            this.calculatePendingLeaves(companyId)
        ]);
        const cashScore = cash > 0 ? 100 : 50;
        const salesScore = revenue >= 60000 ? 100 : 70;
        const invScore = stockAlerts.value === 0 ? 100 : Math.max(0, 100 - (stockAlerts.value * 10));
        const score = Math.round((cashScore * 0.4) + (salesScore * 0.3) + (invScore * 0.3));
        return {
            value: score,
            metadata: {
                factors: {
                    cashFlow: { score: cashScore, status: cashScore >= 80 ? 'healthy' : 'attention' },
                    sales: { score: salesScore, status: salesScore >= 80 ? 'growing' : 'attention' },
                    inventory: { score: invScore, status: invScore >= 80 ? 'healthy' : 'attention' },
                    hr: { score: 100, status: 'stable' }
                }
            }
        };
    }
    async calculateProductionStats(companyId) {
        const [moStats, actualCosts] = await Promise.all([
            this.prisma.manufacturingOrder.groupBy({
                by: ['status'],
                where: { companyId },
                _count: { _all: true }
            }),
            this.prisma.manufacturingOrder.aggregate({
                where: { companyId, status: client_1.ManufacturingOrderStatus.COMPLETED },
                _sum: { totalActualCost: true }
            })
        ]);
        const inProgress = moStats.find(s => s.status === client_1.ManufacturingOrderStatus.IN_PROGRESS)?._count?._all || 0;
        return {
            value: inProgress,
            metadata: {
                inProgress,
                actualCosts: Number(actualCosts._sum.totalActualCost || 0)
            }
        };
    }
    async calculateProcurementStats(companyId) {
        const pendingPOs = await this.prisma.purchaseOrder.aggregate({
            where: { companyId, status: { in: [client_1.PurchaseOrderStatus.DRAFT, client_1.PurchaseOrderStatus.SENT, client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED] } },
            _count: { _all: true },
            _sum: { totalTtc: true }
        });
        const topSuppliersRaw = await this.prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            where: { companyId },
            _sum: { totalTtc: true }
        });
        const sortedSuppliers = topSuppliersRaw
            .sort((a, b) => Number(b._sum.totalTtc || 0) - Number(a._sum.totalTtc || 0))
            .slice(0, 5);
        const supplierNames = await this.prisma.supplier.findMany({
            where: { id: { in: sortedSuppliers.map(s => s.supplierId) } },
            select: { id: true, name: true }
        });
        return {
            value: Number(pendingPOs._sum.totalTtc || 0),
            metadata: {
                pendingCount: pendingPOs._count._all || 0,
                pendingValue: Number(pendingPOs._sum.totalTtc || 0),
                topSuppliers: supplierNames.map(s => ({
                    name: s.name,
                    value: Number(sortedSuppliers.find(ts => ts.supplierId === s.id)?._sum?.totalTtc || 0)
                }))
            }
        };
    }
    async calculateSalesStats(companyId) {
        const activeOrders = await this.prisma.salesOrder.count({
            where: { companyId, status: { in: [client_1.SalesOrderStatus.VALIDATED, client_1.SalesOrderStatus.PREPARING, client_1.SalesOrderStatus.SHIPPED] } }
        });
        const topProductsRaw = await this.prisma.salesOrderLine.groupBy({
            by: ['productId'],
            where: { salesOrder: { companyId } },
            _sum: { lineTotalTtc: true, quantity: true }
        });
        const chartDataRaw = await this.prisma.salesOrder.groupBy({
            by: ['date'],
            where: {
                companyId,
                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            _sum: { totalAmountTtc: true }
        });
        const sortedProducts = topProductsRaw
            .sort((a, b) => Number(b._sum.lineTotalTtc || 0) - Number(a._sum.lineTotalTtc || 0))
            .slice(0, 5);
        const productNames = await this.prisma.product.findMany({
            where: { id: { in: sortedProducts.map(p => p.productId) } },
            select: { id: true, name: true }
        });
        return {
            value: activeOrders,
            metadata: {
                activeOrders,
                topSellingProducts: productNames.map(p => ({
                    id: p.id,
                    name: p.name,
                    revenue: Number(sortedProducts.find(tp => tp.productId === p.id)?._sum?.lineTotalTtc || 0),
                    quantity: Number(sortedProducts.find(tp => tp.productId === p.id)?._sum?.quantity || 0)
                })),
                chartData: chartDataRaw
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map(d => ({
                    date: d.date.toISOString().split('T')[0],
                    revenue: Number(d._sum.totalAmountTtc || 0)
                }))
            }
        };
    }
    async calculateRecentActivity(companyId) {
        const logs = await this.prisma.auditLog.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { user: { select: { email: true } } }
        });
        return {
            value: logs.length,
            metadata: logs.map(l => ({
                id: l.id,
                description: `${l.action} ${l.entity} ${l.description || ''}`,
                user: l.user?.email || 'System',
                timestamp: l.createdAt
            }))
        };
    }
    async calculateProfitability(companyId) {
        const revenue = await this.calculateRevenue(companyId);
        const [salesCogs, expenses] = await Promise.all([
            this.prisma.salesOrderLine.aggregate({
                where: { salesOrder: { companyId, status: { in: [client_1.SalesOrderStatus.SHIPPED, client_1.SalesOrderStatus.INVOICED] } } },
                _sum: { unitCostSnapshot: true }
            }),
            this.prisma.expense.aggregate({
                where: { companyId },
                _sum: { amount: true }
            })
        ]);
        const roughCogs = Number(salesCogs._sum.unitCostSnapshot || 0);
        const totalCosts = roughCogs + Number(expenses._sum.amount || 0);
        if (revenue === 0)
            return 0;
        return ((revenue - totalCosts) / revenue) * 100;
    }
};
exports.KpiService = KpiService;
__decorate([
    (0, event_emitter_1.OnEvent)('dashboard.refresh', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KpiService.prototype, "handleDashboardRefresh", null);
exports.KpiService = KpiService = KpiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KpiService);
//# sourceMappingURL=kpi.service.js.map