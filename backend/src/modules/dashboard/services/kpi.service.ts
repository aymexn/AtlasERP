import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { 
    InvoiceStatus, 
    PaymentMethod, 
    PurchaseOrderStatus, 
    ReceptionStatus, 
    ManufacturingOrderStatus, 
    EmployeeStatus, 
    LeaveStatus,
    SalesOrderStatus
} from '@prisma/client';

@Injectable()
export class KpiService {
    private readonly logger = new Logger(KpiService.name);

    constructor(private prisma: PrismaService) { }

    @OnEvent('dashboard.refresh', { async: true })
    async handleDashboardRefresh(payload: { companyId: string, metrics?: string[] }) {
        const metrics = payload.metrics || [
            'total_sales', 'revenue', 'cash_flow', 'inventory_value', 
            'stock_alerts', 'active_purchase_orders', 'total_receptions', 
            'validated_receptions', 'pending_receptions', 'active_employees', 
            'pending_leaves', 'profitability', 'revenue_today', 'revenue_month'
        ];
        await this.recalculate(payload.companyId, metrics);
    }

    /**
     * Recalculates specific metrics for a company
     */
    async recalculate(companyId: string, metrics: string[]) {
        this.logger.log(`Recalculating metrics for company ${companyId}: ${metrics.join(', ')}`);
        
        const calculators: Record<string, () => Promise<any>> = {
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
                } catch (error) {
                    this.logger.error(`Error calculating metric ${metric}: ${error.message}`);
                }
            }
        }
    }

    private async updateKpi(companyId: string, metric: string, data: any) {
        const value = typeof data === 'number' ? data : (data.value ?? 0);
        const metadata = typeof data === 'object' ? (data.metadata ?? null) : null;
        const unit = typeof data === 'object' ? (data.unit ?? null) : null;

        await this.prisma.companyKpi.upsert({
            where: { companyId_metric: { companyId, metric } },
            update: { value, metadata, unit, updatedAt: new Date() },
            create: { companyId, metric, value, metadata, unit }
        });
    }

    async getAll(companyId: string): Promise<Record<string, any>> {
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
        }, {} as Record<string, any>);
    }

    // ==================== CALCULATORS ====================

    private async calculateTotalSales(companyId: string): Promise<number> {
        return this.prisma.salesOrder.count({
            where: { companyId, status: { not: SalesOrderStatus.CANCELLED } }
        });
    }

    private async calculateRevenue(companyId: string): Promise<number> {
        // Blueprint: SUM(invoices.totalTtc) WHERE status IN (PAID, PARTIAL, UNPAID)
        const result = await this.prisma.invoice.aggregate({
          where: { 
            companyId,
            status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL, InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }
          },
          _sum: { totalAmountTtc: true }
        });
        return Number((result as any)._sum.totalAmountTtc || 0);
    }

    private async calculateRevenueToday(companyId: string): Promise<number> {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const result = await this.prisma.invoice.aggregate({
            where: { companyId, date: { gte: start } },
            _sum: { totalAmountTtc: true }
        });
        return Number((result as any)._sum.totalAmountTtc || 0);
    }

    private async calculateRevenueMonth(companyId: string): Promise<number> {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        const result = await this.prisma.invoice.aggregate({
            where: { companyId, date: { gte: start } },
            _sum: { totalAmountTtc: true }
        });
        return Number((result as any)._sum.totalAmountTtc || 0);
    }

    private async calculateCashFlow(companyId: string): Promise<number> {
        // Blueprint: SUM(received) - SUM(sent)
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

        return Number((received as any)._sum.amount || 0) - Number((expenses as any)._sum.amount || 0);
    }

    private async calculateInventoryValue(companyId: string): Promise<number> {
        const products = await this.prisma.product.findMany({
          where: { companyId, stockQuantity: { gt: 0 } },
          select: { stockQuantity: true, standardCost: true }
        });

        return products.reduce((total, p) => {
          return total + (Number(p.stockQuantity) * Number(p.standardCost || 0));
        }, 0);
    }

    private async calculateStockAlerts(companyId: string): Promise<{ value: number; metadata: any }> {
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

    private async calculateActivePurchaseOrders(companyId: string): Promise<number> {
        return this.prisma.purchaseOrder.count({
          where: {
            companyId,
            status: { notIn: [PurchaseOrderStatus.FULLY_RECEIVED, PurchaseOrderStatus.CANCELLED] }
          }
        });
    }

    private async calculateTotalReceptions(companyId: string): Promise<number> {
        return this.prisma.stockReception.count({
          where: { companyId }
        });
    }

    private async calculateValidatedReceptions(companyId: string): Promise<number> {
        return this.prisma.stockReception.count({
          where: { companyId, status: ReceptionStatus.VALIDATED }
        });
    }

    private async calculatePendingReceptions(companyId: string): Promise<number> {
        return this.prisma.stockReception.count({
          where: { companyId, status: ReceptionStatus.DRAFT }
        });
    }

    private async calculateActiveEmployees(companyId: string): Promise<number> {
        return this.prisma.employee.count({
          where: { companyId, status: EmployeeStatus.ACTIVE }
        });
    }

    private async calculatePendingLeaves(companyId: string): Promise<number> {
        return this.prisma.leaveRequest.count({
            where: { 
                employee: { companyId },
                status: LeaveStatus.PENDING
            }
        });
    }

    private async calculateHealthScore(companyId: string): Promise<{ value: number, metadata: any }> {
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

    private async calculateProductionStats(companyId: string): Promise<{ value: number, metadata: any }> {
        const [moStats, actualCosts] = await Promise.all([
            this.prisma.manufacturingOrder.groupBy({
                by: ['status'],
                where: { companyId },
                _count: { _all: true }
            }),
            this.prisma.manufacturingOrder.aggregate({
                where: { companyId, status: ManufacturingOrderStatus.COMPLETED },
                _sum: { totalActualCost: true }
            })
        ]);

        const inProgress = moStats.find(s => s.status === ManufacturingOrderStatus.IN_PROGRESS)?._count?._all || 0;

        return {
            value: inProgress,
            metadata: {
                inProgress,
                actualCosts: Number((actualCosts as any)._sum.totalActualCost || 0)
            }
        };
    }

    private async calculateProcurementStats(companyId: string): Promise<{ value: number, metadata: any }> {
        const pendingPOs = await this.prisma.purchaseOrder.aggregate({
            where: { companyId, status: { in: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SENT, PurchaseOrderStatus.PARTIALLY_RECEIVED] } },
            _count: { _all: true },
            _sum: { totalTtc: true }
        });

        const topSuppliersRaw = await this.prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            where: { companyId },
            _sum: { totalTtc: true }
        });

        // Sort manually since Prisma groupBy doesn't support orderBy on aggregated fields
        const sortedSuppliers = (topSuppliersRaw as any[])
            .sort((a, b) => Number(b._sum.totalTtc || 0) - Number(a._sum.totalTtc || 0))
            .slice(0, 5);

        const supplierNames = await this.prisma.supplier.findMany({
            where: { id: { in: sortedSuppliers.map(s => s.supplierId) } },
            select: { id: true, name: true }
        });

        return {
            value: Number((pendingPOs as any)._sum.totalTtc || 0),
            metadata: {
                pendingCount: (pendingPOs as any)._count._all || 0,
                pendingValue: Number((pendingPOs as any)._sum.totalTtc || 0),
                topSuppliers: supplierNames.map(s => ({
                    name: s.name,
                    value: Number(sortedSuppliers.find(ts => ts.supplierId === s.id)?._sum?.totalTtc || 0)
                }))
            }
        };
    }

    private async calculateSalesStats(companyId: string): Promise<{ value: number, metadata: any }> {
        const activeOrders = await this.prisma.salesOrder.count({
            where: { companyId, status: { in: [SalesOrderStatus.VALIDATED, SalesOrderStatus.PREPARING, SalesOrderStatus.SHIPPED] } }
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

        const sortedProducts = (topProductsRaw as any[])
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
                chartData: (chartDataRaw as any[])
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map(d => ({
                        date: d.date.toISOString().split('T')[0],
                        revenue: Number(d._sum.totalAmountTtc || 0)
                    }))
            }
        };
    }

    private async calculateRecentActivity(companyId: string): Promise<{ value: number, metadata: any }> {
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
                user: (l as any).user?.email || 'System',
                timestamp: l.createdAt
            }))
        };
    }

    private async calculateProfitability(companyId: string): Promise<number> {
        const revenue = await this.calculateRevenue(companyId);
        
        const [salesCogs, expenses] = await Promise.all([
            this.prisma.salesOrderLine.aggregate({
                where: { salesOrder: { companyId, status: { in: [SalesOrderStatus.SHIPPED, SalesOrderStatus.INVOICED] } } },
                _sum: { unitCostSnapshot: true } 
            }),
            this.prisma.expense.aggregate({
                where: { companyId },
                _sum: { amount: true }
            })
        ]);

        const roughCogs = Number((salesCogs as any)._sum.unitCostSnapshot || 0); 
        const totalCosts = roughCogs + Number((expenses as any)._sum.amount || 0);
        
        if (revenue === 0) return 0;
        return ((revenue - totalCosts) / revenue) * 100;
    }
}
