import { PrismaService } from '../../prisma/prisma.service';
import { AbcClassificationService } from './abc-classification.service';
import { DeadStockService } from './dead-stock.service';
import { ReorderPointService } from './reorder-point.service';
export declare class AnalyticsCronService {
    private prisma;
    private abcService;
    private deadStockService;
    private reorderService;
    private readonly logger;
    constructor(prisma: PrismaService, abcService: AbcClassificationService, deadStockService: DeadStockService, reorderService: ReorderPointService);
    handleWeeklyAbc(): Promise<void>;
    handleDailyDeadStock(): Promise<void>;
    handleWeeklyReorderPoints(): Promise<void>;
}
