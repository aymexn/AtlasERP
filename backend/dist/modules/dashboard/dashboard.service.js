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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const cache_service_1 = require("../../common/services/cache.service");
let DashboardService = class DashboardService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async getProductionStats(companyId) {
        const cacheKey = `dashboard_stats_${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const activeStatuses = [client_1.ManufacturingOrderStatus.PLANNED, client_1.ManufacturingOrderStatus.IN_PROGRESS];
        const [orders, orderStats, inProgressStats, activeOrders, outOfStockCount, lowStockCount, productsWithoutFormula, recentActivity, pendingPOStats, pendingPOCount, topSuppliers, rawMaterialStockValue, salesRevenue, activeSalesCount, customerCount, allExpenses, allReceipts, salesPerformance, salesLines, invoiceStats, topProducts, recentSalesForChart, recentPurchasesForChart, activeEmployeeCount, pendingLeavesCount, todayRevenue, yesterdayRevenue, newCustomersToday] = await Promise.all([
            this.prisma.manufacturingOrder.groupBy({
                by: ['status'],
                where: { companyId },
                _count: { _all: true }
            }),
            this.prisma.manufacturingOrder.aggregate({
                where: { companyId, status: client_1.ManufacturingOrderStatus.COMPLETED },
                _sum: { totalActualCost: true, producedQuantity: true }
            }),
            this.prisma.manufacturingOrder.aggregate({
                where: { companyId, status: client_1.ManufacturingOrderStatus.IN_PROGRESS },
                _sum: { totalEstimatedCost: true }
            }),
            this.prisma.manufacturingOrder.findMany({
                where: { companyId, status: { in: [client_1.ManufacturingOrderStatus.PLANNED, client_1.ManufacturingOrderStatus.IN_PROGRESS] } },
                include: { lines: { include: { component: { select: { stockQuantity: true } } } } },
                take: 50
            }),
            this.prisma.product.count({
                where: { companyId, isActive: true, stockQuantity: { lte: 0 } }
            }),
            this.prisma.product.count({
                where: {
                    companyId,
                    isActive: true,
                    stockQuantity: { gt: 0, lte: this.prisma.product.fields.minStock },
                    minStock: { gt: 0 }
                }
            }),
            this.prisma.product.count({
                where: { companyId, articleType: { in: [client_1.ArticleType.FINISHED_PRODUCT, client_1.ArticleType.SEMI_FINISHED] }, bomsAsFinishedProduct: { none: { status: 'ACTIVE' } } }
            }),
            this.prisma.manufacturingOrder.findMany({
                where: { companyId }, orderBy: { updatedAt: 'desc' }, take: 5, include: { product: { select: { name: true } } }
            }),
            this.prisma.purchaseOrder.aggregate({
                where: { companyId, status: { in: [client_1.PurchaseOrderStatus.SENT, client_1.PurchaseOrderStatus.CONFIRMED, client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED] } }, _sum: { totalTtc: true }
            }),
            this.prisma.purchaseOrder.count({
                where: { companyId, status: { in: [client_1.PurchaseOrderStatus.SENT, client_1.PurchaseOrderStatus.CONFIRMED, client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED] } }
            }),
            this.prisma.purchaseOrder.groupBy({
                by: ['supplierId'], where: { companyId, status: client_1.PurchaseOrderStatus.FULLY_RECEIVED }, _sum: { totalTtc: true }, orderBy: { _sum: { totalTtc: 'desc' } }, take: 3
            }),
            this.prisma.product.aggregate({
                where: { companyId, articleType: client_1.ArticleType.RAW_MATERIAL }, _sum: { stockValue: true }
            }),
            this.prisma.salesOrder.aggregate({
                where: { companyId, status: { in: ['SHIPPED', 'INVOICED'] }, date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { totalAmountHt: true }
            }),
            this.prisma.salesOrder.count({
                where: { companyId, status: { in: [client_1.SalesOrderStatus.DRAFT, client_1.SalesOrderStatus.VALIDATED, client_1.SalesOrderStatus.PREPARING] } }
            }),
            this.prisma.customer.count({
                where: { companyId, isActive: true }
            }),
            this.prisma.expense.aggregate({
                where: { companyId }, _sum: { amount: true }
            }),
            this.prisma.payment.aggregate({
                where: { companyId }, _sum: { amount: true }
            }),
            this.prisma.salesOrderLine.aggregate({
                where: { salesOrder: { companyId, status: { in: [client_1.SalesOrderStatus.SHIPPED, client_1.SalesOrderStatus.INVOICED] } } }, _sum: { lineTotalHt: true }
            }),
            this.prisma.salesOrderLine.findMany({
                where: { salesOrder: { companyId, status: { in: [client_1.SalesOrderStatus.SHIPPED, client_1.SalesOrderStatus.INVOICED] } } }, select: { quantity: true, unitCostSnapshot: true }
            }),
            this.prisma.invoice.aggregate({
                where: { companyId, status: { not: client_1.InvoiceStatus.CANCELLED } }, _sum: { totalAmountTtc: true, amountPaid: true }
            }),
            this.prisma.salesOrderLine.groupBy({
                by: ['productId'], where: { salesOrder: { companyId, status: { in: [client_1.SalesOrderStatus.SHIPPED, client_1.SalesOrderStatus.INVOICED] } } }, _sum: { quantity: true, lineTotalHt: true }, orderBy: { _sum: { lineTotalHt: 'desc' } }, take: 5
            }),
            this.prisma.salesOrder.findMany({
                where: {
                    companyId,
                    status: { not: 'CANCELLED' },
                    date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                },
                select: { date: true, totalAmountHt: true },
                orderBy: { date: 'asc' }
            }),
            this.prisma.purchaseOrder.findMany({
                where: {
                    companyId,
                    status: { not: 'CANCELLED' },
                    orderDate: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                },
                select: { orderDate: true, totalTtc: true },
                orderBy: { orderDate: 'asc' }
            }),
            this.prisma.employee.count({ where: { companyId, status: client_1.EmployeeStatus.ACTIVE } }),
            this.prisma.leaveRequest.count({
                where: {
                    employee: { companyId },
                    status: client_1.LeaveStatus.PENDING
                }
            }),
            this.prisma.salesOrder.aggregate({
                where: {
                    companyId,
                    status: { in: ['SHIPPED', 'INVOICED', 'VALIDATED'] },
                    date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                },
                _sum: { totalAmountHt: true }
            }),
            this.prisma.salesOrder.aggregate({
                where: {
                    companyId,
                    status: { in: ['SHIPPED', 'INVOICED', 'VALIDATED'] },
                    date: {
                        gte: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                },
                _sum: { totalAmountHt: true }
            }),
            this.prisma.customer.count({
                where: {
                    companyId,
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            })
        ]);
        const [supplierNames, topProductNames] = await Promise.all([
            this.prisma.supplier.findMany({
                where: { id: { in: topSuppliers.map(s => s.supplierId) } },
                select: { id: true, name: true }
            }),
            this.prisma.product.findMany({
                where: { id: { in: topProducts.map(p => p.productId) } },
                select: { id: true, name: true }
            })
        ]);
        const totalActualCost = Number(orderStats._sum.totalActualCost || 0);
        const totalEstimatedCost = Number(inProgressStats._sum.totalEstimatedCost || 0);
        const totalCogs = salesLines.reduce((acc, line) => acc + (Number(line.quantity) * Number(line.unitCostSnapshot || 0)), 0);
        const invoiced = Number(invoiceStats._sum.totalAmountTtc || 0);
        const collected = Number(invoiceStats._sum.amountPaid || 0);
        const netGap = invoiced - collected;
        const totalRevenue = Number(salesPerformance._sum.lineTotalHt || 0);
        const totalExpenses = Number(allExpenses._sum.amount || 0);
        const netProfit = totalRevenue - totalCogs - totalExpenses;
        const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const cashPosition = Number(allReceipts._sum.amount || 0) - totalExpenses;
        const cashScore = cashPosition > 0 ? 100 : 50;
        const salesScore = Number(todayRevenue._sum.totalAmountHt || 0) >= 60000 ? 100 : 70;
        const invScore = (outOfStockCount + lowStockCount) === 0 ? 100 : Math.max(0, 100 - (outOfStockCount * 10) - (lowStockCount * 2));
        const invoiceScore = netGap <= 0 ? 100 : Math.max(0, 100 - (netGap / 10000));
        const hrScore = 100;
        const healthScore = Math.round((cashScore * 0.3) +
            (salesScore * 0.25) +
            (invScore * 0.2) +
            (invoiceScore * 0.15) +
            (hrScore * 0.1));
        const allDates = new Set();
        const salesChartMap = new Map();
        const purchasesChartMap = new Map();
        recentSalesForChart.forEach(sale => {
            const dateStr = sale.date.toISOString().split('T')[0];
            allDates.add(dateStr);
            salesChartMap.set(dateStr, (salesChartMap.get(dateStr) || 0) + Number(sale.totalAmountHt || 0));
        });
        recentPurchasesForChart.forEach(po => {
            const dateStr = po.orderDate.toISOString().split('T')[0];
            allDates.add(dateStr);
            purchasesChartMap.set(dateStr, (purchasesChartMap.get(dateStr) || 0) + Number(po.totalTtc || 0));
        });
        const chartData = Array.from(allDates).sort().map(date => ({
            date,
            revenue: salesChartMap.get(date) || 0,
            procurement: purchasesChartMap.get(date) || 0
        }));
        topProducts.forEach((p) => {
            p.product = topProductNames.find(pn => pn.id === p.productId);
        });
        const result = {
            orders: {
                active: orders.filter((o) => activeStatuses.includes(o.status)).reduce((acc, o) => acc + o._count._all, 0),
                planned: orders.find((o) => o.status === 'PLANNED')?._count?._all || 0,
                inProgress: orders.find((o) => o.status === 'IN_PROGRESS')?._count?._all || 0,
                completed: orders.find((o) => o.status === 'COMPLETED')?._count?._all || 0,
                draft: orders.find((o) => o.status === 'DRAFT')?._count?._all || 0
            },
            costs: {
                estimated: totalEstimatedCost,
                actual: totalActualCost,
                variance: totalActualCost - totalEstimatedCost
            },
            alerts: {
                outOfStock: outOfStockCount,
                lowStock: lowStockCount,
                missingFormula: productsWithoutFormula
            },
            procurement: {
                pendingValue: Number(pendingPOStats._sum.totalTtc || 0),
                pendingCount: pendingPOCount,
                rawMaterialValue: Number(rawMaterialStockValue._sum.stockValue || 0),
                topSuppliers: topSuppliers.map(ts => ({
                    name: supplierNames.find(s => s.id === ts.supplierId)?.name || 'Inconnu',
                    value: Number(ts._sum.totalTtc || 0)
                }))
            },
            sales: {
                monthlyRevenue: Number(salesRevenue._sum.totalAmountHt || 0),
                activeOrders: activeSalesCount,
                customerCount: customerCount,
                topSellingProducts: topProducts.map(p => ({
                    name: p.product?.name || 'Inconnu',
                    quantity: Number(p._sum.quantity || 0),
                    revenue: Number(p._sum.lineTotalHt || 0)
                })),
                chartData
            },
            finances: {
                invoiced,
                collected,
                netGap,
                actualCash: Number(allReceipts._sum.amount || 0),
                totalExpenses,
                totalRevenue,
                totalCogs,
                netProfit,
                marginPercent,
                cashPosition: cashPosition
            },
            hr: {
                activeEmployees: activeEmployeeCount,
                pendingLeaves: pendingLeavesCount
            },
            health: {
                score: healthScore,
                factors: {
                    cashFlow: { score: cashScore, status: cashScore >= 80 ? 'healthy' : 'attention' },
                    sales: { score: salesScore, status: salesScore >= 80 ? 'growing' : 'attention' },
                    inventory: { score: invScore, status: invScore >= 80 ? 'healthy' : 'attention' },
                    invoices: { score: invoiceScore, status: invoiceScore >= 80 ? 'good' : 'attention' },
                    hr: { score: hrScore, status: 'stable' }
                }
            },
            todayPerformance: {
                revenueToday: Number(todayRevenue._sum.totalAmountHt || 0),
                revenueYesterday: Number(yesterdayRevenue._sum.totalAmountHt || 0),
                revenueTarget: 60000,
                newCustomers: newCustomersToday
            },
            recentActivity
        };
        await this.cache.set(cacheKey, result, 300);
        return result;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map