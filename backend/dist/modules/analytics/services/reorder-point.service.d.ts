import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class ReorderPointService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculateReorderPoint(companyId: string, productId: string, warehouseId: string | null, serviceLevelPercent?: number): Promise<{
        reorderPoint: Decimal;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        leadTimeDays: number | null;
        warehouseId: string | null;
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
