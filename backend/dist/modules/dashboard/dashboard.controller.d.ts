import { DashboardService } from './dashboard.service';
import { KpiService } from './services/kpi.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardController {
    private dashboardService;
    private kpiService;
    private prisma;
    constructor(dashboardService: DashboardService, kpiService: KpiService, prisma: PrismaService);
    getKpi(req: any): Promise<Record<string, any>>;
    refreshKpi(req: any): Promise<{
        success: boolean;
    }>;
}
