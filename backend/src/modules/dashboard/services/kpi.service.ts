import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { DashboardGateway } from '../gateways/dashboard.gateway';

@Injectable()
export class KpiService {
    private readonly logger = new Logger(KpiService.name);

    constructor(
        private prisma: PrismaService,
        private gateway: DashboardGateway
    ) { }

    async refreshAllKpisForCompany(companyId: string) {
        const allMetrics = [
            'total_sales', 'revenue', 'cash_flow', 'inventory_value', 
            'stock_alerts', 'active_purchase_orders', 'total_receptions', 
            'validated_receptions', 'pending_receptions', 'active_employees', 
            'pending_leaves', 'profitability', 'revenue_today', 'revenue_month',
            'health_score', 'production_stats', 'procurement_stats', 'sales_stats',
            'recent_activity', 'collected_revenue', 'recovery_rate'
        ];
        await this.recalculate(companyId, allMetrics);
    }

    @OnEvent('dashboard.refresh')
    async handleDashboardRefresh(payload: { companyId: string, metrics?: string[] }) {
        if (payload.metrics) {
            await this.recalculate(payload.companyId, payload.metrics);
        } else {
            await this.refreshAllKpisForCompany(payload.companyId);
        }
    }

    /**
     * Recalculates specific metrics for a company using RAW SQL
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
            'collected_revenue': () => this.calculateCollectedRevenue(companyId),
            'recovery_rate': () => this.calculateRecoveryRate(companyId),
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

        const kpi = await this.prisma.companyKpi.upsert({
            where: { companyId_metric: { companyId, metric } },
            update: { value, metadata, unit, updatedAt: new Date() },
            create: { companyId, metric, value, metadata, unit }
        });

        // Broadcast to clients connected via WebSockets
        try {
            this.gateway.broadcastKpiUpdate(companyId, {
                metric,
                value,
                metadata,
                unit,
                updatedAt: kpi.updatedAt
            });
        } catch (e) {
            this.logger.warn(`Failed to broadcast KPI update via WebSocket: ${e.message}`);
        }
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

    // ==================== RAW SQL CALCULATORS ====================

    private async calculateTotalSales(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM sales_orders 
            WHERE company_id = ${companyId}::uuid AND status != 'CANCELLED'
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculateRevenue(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ revenue: number }>>`
            SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
            FROM invoices 
            WHERE company_id = ${companyId}::uuid 
              AND status IN ('PAID', 'PARTIAL', 'SENT', 'OVERDUE')
        `;
        return Number(result[0]?.revenue || 0);
    }

    private async calculateRevenueToday(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ revenue: number }>>`
            SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
            FROM invoices 
            WHERE company_id = ${companyId}::uuid 
              AND date >= CURRENT_DATE
        `;
        return Number(result[0]?.revenue || 0);
    }

    private async calculateRevenueMonth(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ revenue: number }>>`
            SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
            FROM invoices 
            WHERE company_id = ${companyId}::uuid 
              AND date >= DATE_TRUNC('month', CURRENT_DATE)
              AND status IN ('PAID', 'PARTIAL', 'SENT', 'OVERDUE')
        `;
        return Number(result[0]?.revenue || 0);
    }

    private async calculateCashFlow(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ cash_flow: number }>>`
            SELECT (
              (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE company_id = ${companyId}::uuid) -
              (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = ${companyId}::uuid)
            )::float as cash_flow
        `;
        return Number(result[0]?.cash_flow || 0);
    }

    private async calculateInventoryValue(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ value: number }>>`
            SELECT COALESCE(SUM(stock_quantity * standard_cost), 0)::float as value 
            FROM products 
            WHERE company_id = ${companyId}::uuid AND stock_quantity > 0
        `;
        return Number(result[0]?.value || 0);
    }

    private async calculateStockAlerts(companyId: string): Promise<{ value: number; metadata: any }> {
        const alerts = await this.prisma.$queryRaw<Array<{ 
            id: string; 
            sku: string; 
            name: string; 
            currentStock: number; 
            minLevel: number; 
            unit: string; 
        }>>`
            SELECT id, sku, name, 
                   stock_quantity::float as "currentStock", 
                   reorder_point::float as "minLevel", 
                   unit 
            FROM products 
            WHERE company_id = ${companyId}::uuid 
              AND is_active = true 
              AND stock_quantity < reorder_point
        `;

        return {
            value: alerts.length,
            metadata: alerts.map(p => ({
                productId: p.id,
                sku: p.sku,
                name: p.name,
                currentStock: p.currentStock,
                minLevel: p.minLevel,
                unit: p.unit,
                status: p.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
            }))
        };
    }

    private async calculateActivePurchaseOrders(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM purchase_orders 
            WHERE company_id = ${companyId}::uuid 
              AND status NOT IN ('FULLY_RECEIVED', 'CANCELLED')
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculateTotalReceptions(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM stock_receptions 
            WHERE company_id = ${companyId}::uuid
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculateValidatedReceptions(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM stock_receptions 
            WHERE company_id = ${companyId}::uuid AND status = 'VALIDATED'
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculatePendingReceptions(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM stock_receptions 
            WHERE company_id = ${companyId}::uuid AND status = 'DRAFT'
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculateActiveEmployees(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM employees 
            WHERE company_id = ${companyId}::uuid AND status = 'ACTIVE'
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculatePendingLeaves(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            WHERE e.company_id = ${companyId}::uuid AND lr.status = 'PENDING'
        `;
        return Number(result[0]?.count || 0);
    }

    private async calculateProfitability(companyId: string): Promise<number> {
        const revenue = await this.calculateRevenue(companyId);
        if (revenue === 0) return 0;
        
        const cogsResult = await this.prisma.$queryRaw<Array<{ cogs: number }>>`
            SELECT COALESCE(SUM(sol.unit_cost_snapshot * sol.quantity), 0)::float as cogs
            FROM sales_order_lines sol
            JOIN sales_orders so ON sol.sales_order_id = so.id
            WHERE so.company_id = ${companyId}::uuid 
              AND so.status IN ('SHIPPED', 'INVOICED')
        `;
        
        const cogs = cogsResult[0]?.cogs || 0;
        return ((revenue - cogs) / revenue) * 100;
    }

    private async calculateCollectedRevenue(companyId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<Array<{ collected: number }>>`
            SELECT COALESCE(SUM(amount_paid), 0)::float as collected
            FROM invoices
            WHERE company_id = ${companyId}::uuid
              AND status NOT IN ('CANCELLED')
        `;
        return Number(result[0]?.collected || 0);
    }

    private async calculateRecoveryRate(companyId: string): Promise<number> {
        const revenue = await this.calculateRevenue(companyId);
        if (revenue === 0) return 0;
        const collected = await this.calculateCollectedRevenue(companyId);
        return (collected / revenue) * 100;
    }

    private async calculateHealthScore(companyId: string): Promise<{ value: number, metadata: any }> {
        const cash = await this.calculateCashFlow(companyId);
        const revenue = await this.calculateRevenueToday(companyId);
        const stockAlerts = await this.calculateStockAlerts(companyId);
        
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
        const stats = await this.prisma.$queryRaw<Array<{ status: string, count: number }>>`
            SELECT status, COUNT(*)::int as count 
            FROM manufacturing_orders 
            WHERE company_id = ${companyId}::uuid
            GROUP BY status
        `;
        
        const inProgress = stats.find(s => s.status === 'IN_PROGRESS')?.count || 0;
        
        const costsResult = await this.prisma.$queryRaw<Array<{ actual_costs: number }>>`
            SELECT COALESCE(SUM(total_actual_cost), 0)::float as actual_costs 
            FROM manufacturing_orders 
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED'
        `;

        return {
            value: inProgress,
            metadata: {
                inProgress,
                actualCosts: costsResult[0]?.actual_costs || 0
            }
        };
    }

    private async calculateProcurementStats(companyId: string): Promise<{ value: number, metadata: any }> {
        const pendingPOs = await this.prisma.$queryRaw<Array<{ count: number, total: number }>>`
            SELECT COUNT(*)::int as count, COALESCE(SUM(total_ttc), 0)::float as total
            FROM purchase_orders 
            WHERE company_id = ${companyId}::uuid 
              AND status IN ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED')
        `;

        const topSuppliers = await this.prisma.$queryRaw<Array<{ name: string, value: number }>>`
            SELECT s.name, COALESCE(SUM(po.total_ttc), 0)::float as value
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.company_id = ${companyId}::uuid 
              AND po.status IN ('FULLY_RECEIVED', 'PARTIALLY_RECEIVED', 'CONFIRMED')
            GROUP BY s.name
            ORDER BY value DESC
            LIMIT 5
        `;

        return {
            value: pendingPOs[0]?.total || 0,
            metadata: {
                pendingCount: pendingPOs[0]?.count || 0,
                pendingValue: pendingPOs[0]?.total || 0,
                topSuppliers: topSuppliers
            }
        };
    }

    private async calculateSalesStats(companyId: string): Promise<{ value: number, metadata: any }> {
        const activeCount = await this.prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count 
            FROM sales_orders 
            WHERE company_id = ${companyId}::uuid 
              AND status IN ('VALIDATED', 'PREPARING', 'SHIPPED')
        `;

        const topSellingProducts = await this.prisma.$queryRaw<Array<{ id: string, name: string, revenue: number, quantity: number }>>`
            SELECT p.id, p.name, 
                   COALESCE(SUM(sol.line_total_ttc), 0)::float as revenue, 
                   COALESCE(SUM(sol.quantity), 0)::float as quantity
            FROM sales_order_lines sol
            JOIN sales_orders so ON sol.sales_order_id = so.id
            JOIN products p ON sol.product_id = p.id
            WHERE so.company_id = ${companyId}::uuid
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 5
        `;

        const chartData = await this.prisma.$queryRaw<Array<{ date: string, revenue: number }>>`
            SELECT to_char(date, 'YYYY-MM-DD') as date, 
                   COALESCE(SUM(total_amount_ttc), 0)::float as revenue
            FROM sales_orders
            WHERE company_id = ${companyId}::uuid 
              AND date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY to_char(date, 'YYYY-MM-DD')
            ORDER BY date ASC
        `;

        return {
            value: activeCount[0]?.count || 0,
            metadata: {
                activeOrders: activeCount[0]?.count || 0,
                topSellingProducts,
                chartData
            }
        };
    }

    private async calculateRecentActivity(companyId: string): Promise<{ value: number, metadata: any }> {
        const logs = await this.prisma.$queryRaw<Array<{ id: string, action: string, entity: string, description: string, email: string, created_at: Date }>>`
            SELECT al.id, al.action, al.entity, al.description, COALESCE(u.email, 'System') as email, al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.company_id = ${companyId}::uuid
            ORDER BY al.created_at DESC
            LIMIT 10
        `;

        return {
            value: logs.length,
            metadata: logs.map(l => ({
                id: l.id,
                description: `${l.action} ${l.entity} ${l.description || ''}`,
                user: l.email,
                timestamp: l.created_at
            }))
        };
    }
}
