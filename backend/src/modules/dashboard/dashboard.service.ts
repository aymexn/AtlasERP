import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManufacturingOrderStatus, ArticleType } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getProductionStats(companyId: string) {
        const orders = await this.prisma.manufacturingOrder.findMany({
            where: { companyId },
            include: {
                lines: {
                    include: {
                        component: {
                            select: {
                                stockQuantity: true,
                                minStock: true
                            }
                        }
                    }
                }
            }
        });

        const activeStatuses: ManufacturingOrderStatus[] = ['PLANNED', 'IN_PROGRESS'];
        
        let totalEstimatedCost = 0;
        let totalActualCost = 0;
        let finishedGoodsProduced = 0;
        let rawMaterialsConsumedCount = 0;
        let componentsInShortage = new Set<string>();

        orders.forEach(order => {
            // Only sum costs for active or completed production
            if (['IN_PROGRESS', 'COMPLETED'].includes(order.status)) {
                totalEstimatedCost += Number(order.totalEstimatedCost || 0);
                totalActualCost += Number(order.totalActualCost || 0);
            }
            
            finishedGoodsProduced += Number(order.producedQuantity || 0);

            order.lines.forEach(line => {
                if (Number(line.consumedQuantity) > 0) {
                    rawMaterialsConsumedCount++;
                }
                
                const required = Number(line.requiredQuantity);
                const available = Number(line.component.stockQuantity);
                if (available < required) {
                    componentsInShortage.add(line.componentProductId);
                }
            });
        });

        // Urgent low stock items (used in formulas and below min stock)
        const lowStockComponents = await this.prisma.product.count({
            where: {
                companyId,
                stockQuantity: { lt: this.prisma.product.fields.minStock },
                formulaComponents: { some: {} } // Used in at least one formula
            }
        });

        // Products missing active formulas
        const productsWithoutFormula = await this.prisma.product.count({
            where: {
                companyId,
                articleType: { in: [ArticleType.FINISHED_PRODUCT, ArticleType.SEMI_FINISHED] },
                formulas: { none: { status: 'ACTIVE' } }
            }
        });

        // Recent MO activity
        const recentActivity = await this.prisma.manufacturingOrder.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: { product: { select: { name: true } } }
        });

        // Procurement Metrics
        const pendingPOStats = await this.prisma.purchaseOrder.aggregate({
            where: { companyId, status: { in: ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] } },
            _sum: { totalTtc: true }
        });

        const pendingPOCount = await this.prisma.purchaseOrder.count({
            where: { companyId, status: { in: ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] } }
        });

        const topSuppliers = await this.prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            where: { companyId, status: { not: 'CANCELLED' } },
            _sum: { totalTtc: true },
            orderBy: { _sum: { totalTtc: 'desc' } },
            take: 3
        });

        const supplierNames = await this.prisma.supplier.findMany({
            where: { id: { in: topSuppliers.map(s => s.supplierId) } },
            select: { id: true, name: true }
        });

        const rawMaterialStockValue = await this.prisma.product.aggregate({
            where: { companyId, articleType: ArticleType.RAW_MATERIAL },
            _sum: { stockValue: true }
        });

        // Sales Metrics
        const salesRevenue = await this.prisma.salesOrder.aggregate({
            where: { 
                companyId, 
                status: { in: ['SHIPPED', 'INVOICED'] },
                date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } 
            },
            _sum: { totalAmountHt: true }
        });

        const activeSalesCount = await this.prisma.salesOrder.count({
            where: { companyId, status: { in: ['DRAFT', 'VALIDATED', 'PREPARING'] } }
        });

        const customerCount = await this.prisma.customer.count({
            where: { companyId, isActive: true }
        });

        // Financial Metrics
        const allExpenses = await this.prisma.expense.aggregate({
            where: { companyId },
            _sum: { amount: true }
        });

        const allReceipts = await this.prisma.payment.aggregate({
            where: { companyId },
            _sum: { amount: true }
        });

        const salesPerformance = await this.prisma.salesOrderLine.aggregate({
            where: { salesOrder: { companyId, status: { in: ['SHIPPED', 'INVOICED'] } } },
            _sum: { lineTotalHt: true }
        });

        // Calculate COGS (Cost of Goods Sold)
        const salesLines = await this.prisma.salesOrderLine.findMany({
            where: { salesOrder: { companyId, status: { in: ['SHIPPED', 'INVOICED'] } } },
            select: { quantity: true, unitCostSnapshot: true }
        });

        const totalCogs = salesLines.reduce((acc, line) => {
            return acc + (Number(line.quantity) * Number(line.unitCostSnapshot || 0));
        }, 0);

        const totalRevenue = Number(salesPerformance._sum.lineTotalHt || 0);
        const totalExpenses = Number(allExpenses._sum.amount || 0);
        const totalReceipts = Number(allReceipts._sum.amount || 0);
        const netProfit = totalRevenue - totalCogs - totalExpenses;
        const cashPosition = totalReceipts - totalExpenses;

        const topProducts = await this.prisma.salesOrderLine.groupBy({
            by: ['productId'],
            where: { salesOrder: { companyId, status: { in: ['SHIPPED', 'INVOICED'] } } },
            _sum: { quantity: true, lineTotalHt: true },
            orderBy: { _sum: { lineTotalHt: 'desc' } },
            take: 5
        });

        // Get product names for top products
        const topProductNames = await this.prisma.product.findMany({
            where: { id: { in: topProducts.map(p => p.productId) } },
            select: { id: true, name: true }
        });

        // Merge names
        topProducts.forEach((p: any) => {
            p.product = topProductNames.find(pn => pn.id === p.productId);
        });

        return {
            orders: {
                active: orders.filter(o => activeStatuses.includes(o.status)).length,
                planned: orders.filter(o => o.status === 'PLANNED').length,
                inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
                completed: orders.filter(o => o.status === 'COMPLETED').length,
                draft: orders.filter(o => o.status === 'DRAFT').length
            },
            costs: {
                estimated: totalEstimatedCost,
                actual: totalActualCost,
                variance: totalActualCost - totalEstimatedCost
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
                }))
            },
            finances: {
                totalRevenue,
                totalExpenses,
                totalCogs,
                netProfit,
                cashPosition,
                receipts: totalReceipts
            },
            recentActivity
        };
    }
}
