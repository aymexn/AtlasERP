import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class StockTurnoverService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculateTurnover(companyId: string, productId: string, warehouseId: string | null, startDate: Date, endDate: Date): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        periodStart: Date;
        periodEnd: Date;
        productId: string;
        warehouseId: string | null;
        beginningInventory: Decimal;
        endingInventory: Decimal;
        averageInventory: Decimal;
        unitsSold: Decimal;
        turnoverRatio: Decimal;
        daysToSell: Decimal;
        costOfGoodsSold: Decimal;
        averageInventoryValue: Decimal;
    }>;
    getAllAnalytics(companyId: string, startDate: Date, endDate: Date, limit?: number): Promise<({
        product: {
            name: string;
            sku: string;
        };
        warehouse: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        periodStart: Date;
        periodEnd: Date;
        productId: string;
        warehouseId: string | null;
        beginningInventory: Decimal;
        endingInventory: Decimal;
        averageInventory: Decimal;
        unitsSold: Decimal;
        turnoverRatio: Decimal;
        daysToSell: Decimal;
        costOfGoodsSold: Decimal;
        averageInventoryValue: Decimal;
    })[]>;
}
