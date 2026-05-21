import { PrismaService } from '../../prisma/prisma.service';
import { DashboardGateway } from '../gateways/dashboard.gateway';
export declare class KpiService {
    private prisma;
    private gateway;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: DashboardGateway);
    refreshAllKpisForCompany(companyId: string): Promise<void>;
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
    private calculateProfitability;
    private calculateCollectedRevenue;
    private calculateRecoveryRate;
    private calculateHealthScore;
    private calculateProductionStats;
    private calculateProcurementStats;
    private calculateSalesStats;
    private calculateRecentActivity;
}
