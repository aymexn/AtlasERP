import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class ReorderPointService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculateReorderPoint(companyId: string, productId: string, warehouseId: string | null, serviceLevelPercent?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        productId: string;
        warehouseId: string | null;
        reorderPoint: Decimal;
        leadTimeDays: number | null;
        safetyStock: Decimal;
        reorderQuantity: Decimal;
        maximumStock: Decimal | null;
        averageDailyDemand: Decimal | null;
        demandVariability: Decimal | null;
        serviceLevel: Decimal;
        autoCalculate: boolean;
        calculationMethod: string | null;
        lastCalculatedAt: Date | null;
        alertEnabled: boolean;
        alertThreshold: Decimal | null;
    }>;
    getAlerts(companyId: string): Promise<unknown>;
}
