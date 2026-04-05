import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getProductionStats(req: any): Promise<{
        orders: {
            active: number;
            planned: number;
            inProgress: number;
            completed: number;
            draft: number;
        };
        costs: {
            estimated: number;
            actual: number;
            variance: number;
        };
        inventory: {
            shortageCount: number;
            lowStockUrgent: number;
            producedCount: number;
        };
    }>;
}
