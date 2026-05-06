import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class AbcClassificationService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculateABC(companyId: string, startDate: Date, endDate: Date): Promise<{
        success: boolean;
        message: string;
        summary?: undefined;
    } | {
        success: boolean;
        summary: {
            totalProducts: number;
            aItems: number;
            bItems: number;
            cItems: number;
            totalRevenue: any;
        };
        message?: undefined;
    }>;
    getSummary(companyId: string): Promise<unknown>;
    getProductsByClassification(companyId: string, classification: string, limit?: number): Promise<({
        product: {
            name: string;
            sku: string;
            family: {
                name: string;
            };
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        classification: string;
        annualRevenue: Decimal;
        annualUnitsSold: number;
        revenuePercentage: Decimal;
        cumulativeRevenuePercentage: Decimal;
        averageStockValue: Decimal;
        stockTurnoverRate: Decimal;
        daysInStock: Decimal;
        classifiedAt: Date;
        periodStart: Date;
        periodEnd: Date;
    })[]>;
}
