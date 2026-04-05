import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getProductionStats(companyId: string): Promise<{
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
