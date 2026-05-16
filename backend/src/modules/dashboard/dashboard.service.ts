import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManufacturingOrderStatus, ArticleType, PurchaseOrderStatus, SalesOrderStatus, InvoiceStatus, EmployeeStatus, LeaveStatus } from '@prisma/client';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        private cache: CacheService
    ) { }

    async getProductionStats(companyId: string) {
        const cacheKey = `dashboard_stats_${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const activeStatuses = [ManufacturingOrderStatus.PLANNED, ManufacturingOrderStatus.IN_PROGRESS];

        // Execute all independent queries concurrently to achieve < 200ms
        const [
            orders,
            orderStats,
            inProgressStats,
            activeOrders,
            outOfStockCount,
            lowStockCount,
            productsWithoutFormula,
            recentActivity,
            pendingPOStats,
            pendingPOCount,
            topSuppliers,
            rawMaterialStockValue,
            salesRevenue,
            activeSalesCount,
            customerCount,
            allExpenses,
            allReceipts,
            salesPerformance,
            salesLines,
            invoiceStats,
            topProducts,
            recentSalesForChart,
            recentPurchasesForChart,
            activeEmployeeCount,
            pendingLeavesCount,
            todayRevenue,
            yesterdayRevenue,
            newCustomersToday
        ] = await Promise.all([
            // Optimized: We don't need all orders just to count them
            this.prisma.manufacturingOrder.groupBy({
                by: ['status'],
                where: { companyId },
                _count: { _all: true }
            }),
            this.prisma.manufacturingOrder.aggregate({
                where: { companyId, status: ManufacturingOrderStatus.COMPLETED },
                _sum: { totalActualCost: true, producedQuantity: true }
            }),
            this.prisma.manufacturingOrder.aggregate({
                where: { companyId, status: ManufacturingOrderStatus.IN_PROGRESS },
                _sum: { totalEstimatedCost: true }
            }),
            // We still need active orders with details for shortages (might need pagination later if 1000s)
            this.prisma.manufacturingOrder.findMany({
                where: { companyId, status: { in: [ManufacturingOrderStatus.PLANNED, ManufacturingOrderStatus.IN_PROGRESS] } },
                include: { lines: { include: { component: { select: { stockQuantity: true } } } } },
                take: 50 // Limit to top 50 active to keep it fast
            }),
            // Stock Alerts
            this.prisma.product.count({
                where: { companyId, isActive: true, stockQuantity: { lte: 0 } }
            }),
            // Stock Alerts - Low Stock (0 < stock <= min_stock)
            this.prisma.product.count({
                where: { 
                    companyId, 
                    isActive: true, 
                    stockQuantity: { gt: 0, lte: this.prisma.product.fields.minStock },
                    minStock: { gt: 0 }
                }
            }),
            this.prisma.product.count({
                where: { companyId, articleType: { in: [ArticleType.FINISHED_PRODUCT, ArticleType.SEMI_FINISHED] }, bomsAsFinishedProduct: { none: { status: 'ACTIVE' } } }
            }),
            this.prisma.manufacturingOrder.findMany({
                where: { companyId }, orderBy: { updatedAt: 'desc' }, take: 5, include: { product: { select: { name: true } } }
            }),
            this.prisma.purchaseOrder.aggregate({
                where: { companyId, status: { in: [PurchaseOrderStatus.SENT, PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED] } }, _sum: { totalTtc: true }
            }),
            this.prisma.purchaseOrder.count({
                where: { companyId, status: { in: [PurchaseOrderStatus.SENT, PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED] } }
            }),
            this.prisma.purchaseOrder.groupBy({
                by: ['supplierId'], where: { companyId, status: PurchaseOrderStatus.FULLY_RECEIVED }, _sum: { totalTtc: true }, orderBy: { _sum: { totalTtc: 'desc' } }, take: 3
            }),
            this.prisma.product.aggregate({
                where: { companyId, articleType: ArticleType.RAW_MATERIAL }, _sum: { stockValue: true }
            }),
            this.prisma.salesOrder.aggregate({
                where: { companyId, status: { in: ['SHIPPED', 'INVOICED'] }, date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { totalAmountHt: true }
            }),
            this.prisma.salesOrder.count({
                where: { companyId, status: { in: [SalesOrderStatus.DRAFT, SalesOrderStatus.VALIDATED, SalesOrderStatus.PREPARING] } }
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
                where: { salesOrder: { companyId, status: { in: [SalesOrderStatus.SHIPPED, SalesOrderStatus.INVOICED] } } }, _sum: { lineTotalHt: true }
            }),
            this.prisma.salesOrderLine.findMany({
                where: { salesOrder: { companyId, status: { in: [SalesOrderStatus.SHIPPED, SalesOrderStatus.INVOICED] } } }, select: { quantity: true, unitCostSnapshot: true }
            }),
            // Financial Cash Flow Logic
            this.prisma.invoice.aggregate({
                where: { companyId, status: { not: InvoiceStatus.CANCELLED } }, _sum: { totalAmountTtc: true, amountPaid: true }
            }),
            this.prisma.salesOrderLine.groupBy({
                by: ['productId'], where: { salesOrder: { companyId, status: { in: [SalesOrderStatus.SHIPPED, SalesOrderStatus.INVOICED] } } }, _sum: { quantity: true, lineTotalHt: true }, orderBy: { _sum: { lineTotalHt: 'desc' } }, take: 5
            }),
            // Sales chart grouping
            // Sales chart grouping - Optimized with 6 month limit
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
            // HR Stats
            this.prisma.employee.count({ where: { companyId, status: EmployeeStatus.ACTIVE } }),
            this.prisma.leaveRequest.count({ 
                where: { 
                    employee: { companyId }, 
                    status: LeaveStatus.PENDING 
                } 
            }),
            // Today vs Yesterday Revenue
            this.prisma.salesOrder.aggregate({
                where: { 
                    companyId, 
                    status: { in: ['SHIPPED', 'INVOICED', 'VALIDATED'] }, 
                    date: { gte: new Date(new Date().setHours(0,0,0,0)) } 
                },
                _sum: { totalAmountHt: true }
            }),
            this.prisma.salesOrder.aggregate({
                where: { 
                    companyId, 
                    status: { in: ['SHIPPED', 'INVOICED', 'VALIDATED'] }, 
                    date: { 
                        gte: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0)),
                        lt: new Date(new Date().setHours(0,0,0,0))
                    } 
                },
                _sum: { totalAmountHt: true }
            }),
            this.prisma.customer.count({
                where: { 
                    companyId, 
                    createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } 
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

        // Costs
        const totalActualCost = Number(orderStats._sum.totalActualCost || 0);
        const totalEstimatedCost = Number(inProgressStats._sum.totalEstimatedCost || 0);

        // Calculate COGS
        const totalCogs = salesLines.reduce((acc, line) => acc + (Number(line.quantity) * Number(line.unitCostSnapshot || 0)), 0);

        // Finances - Cash Flow Corrected
        const invoiced = Number(invoiceStats._sum.totalAmountTtc || 0);
        const collected = Number(invoiceStats._sum.amountPaid || 0);
        const netGap = invoiced - collected;
        
        const totalRevenue = Number(salesPerformance._sum.lineTotalHt || 0);
        const totalExpenses = Number(allExpenses._sum.amount || 0);
        const netProfit = totalRevenue - totalCogs - totalExpenses;
        const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const cashPosition = Number(allReceipts._sum.amount || 0) - totalExpenses;

        // Health Score Calculation
        const cashScore = cashPosition > 0 ? 100 : 50;
        const salesScore = Number(todayRevenue._sum.totalAmountHt || 0) >= 60000 ? 100 : 70;
        const invScore = (outOfStockCount + lowStockCount) === 0 ? 100 : Math.max(0, 100 - (outOfStockCount * 10) - (lowStockCount * 2));
        const invoiceScore = netGap <= 0 ? 100 : Math.max(0, 100 - (netGap / 10000));
        const hrScore = 100; // Simplified

        const healthScore = Math.round(
            (cashScore * 0.3) + 
            (salesScore * 0.25) + 
            (invScore * 0.2) + 
            (invoiceScore * 0.15) + 
            (hrScore * 0.1)
        );

        // Combined Chart Logic
        const allDates = new Set<string>();
        const salesChartMap = new Map<string, number>();
        const purchasesChartMap = new Map<string, number>();

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

        topProducts.forEach((p: any) => {
            p.product = topProductNames.find(pn => pn.id === p.productId);
        });

        const result = {
            orders: {
                active: (orders as any).filter((o: any) => activeStatuses.includes(o.status)).reduce((acc: number, o: any) => acc + o._count._all, 0),
                planned: (orders as any).find((o: any) => o.status === 'PLANNED')?._count?._all || 0,
                inProgress: (orders as any).find((o: any) => o.status === 'IN_PROGRESS')?._count?._all || 0,
                completed: (orders as any).find((o: any) => o.status === 'COMPLETED')?._count?._all || 0,
                draft: (orders as any).find((o: any) => o.status === 'DRAFT')?._count?._all || 0
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
                topSellingProducts: (topProducts as any[]).map(p => ({
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
}
