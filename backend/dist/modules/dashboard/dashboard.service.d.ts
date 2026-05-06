import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
export declare class DashboardService {
    private prisma;
    private cache;
    constructor(prisma: PrismaService, cache: CacheService);
    getProductionStats(companyId: string): Promise<unknown>;
}
