import { PrismaService } from '../../prisma/prisma.service';
export declare class KpiService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleDashboardRefresh(payload: {
        companyId: string;
        metrics?: string[];
    }): Promise<void>;
    recalculate(companyId: string, metrics: string[]): Promise<void>;
    private updateKpi;
    getAll(companyId: string): Promise<Record<string, any>>;
    private calculateTotalSales;
    private calculateRevenue;
    private calculateRevenueToday;
    private calculateRevenueMonth;
    private calculateCashFlow;
    private calculateInventoryValue;
    private calculateStockAlerts;
    private calculateActivePurchaseOrders;
    private calculateTotalReceptions;
    private calculateValidatedReceptions;
    private calculatePendingReceptions;
    private calculateActiveEmployees;
    private calculatePendingLeaves;
    private calculateHealthScore;
    private calculateProductionStats;
    private calculateProcurementStats;
    private calculateSalesStats;
    private calculateRecentActivity;
    private calculateProfitability;
}
