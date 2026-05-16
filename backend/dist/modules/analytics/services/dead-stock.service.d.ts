import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class DeadStockService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    identifyDeadStock(companyId: string, daysThreshold?: number): Promise<{
        success: boolean;
        summary: {
            totalItems: number;
            totalValue: any;
            byCategory: {
                slowMoving: number;
                deadStock: number;
                obsolete: number;
            };
        };
    }>;
    getReport(companyId: string, category?: string): Promise<({
        product: {
            name: string;
            sku: string;
            standardCost: Decimal;
        };
        warehouse: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: Decimal;
        productId: string;
        stockValue: Decimal;
        reason: string | null;
        warehouseId: string | null;
        category: string;
        actionDate: Date | null;
        lastSaleDate: Date | null;
        daysWithoutSale: number;
        lastPurchaseDate: Date | null;
        daysSincePurchase: number;
        actionRecommended: string | null;
        actionTaken: string | null;
        actionBy: string | null;
        identifiedAt: Date;
    })[]>;
    markAction(itemId: string, action: string, userId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: Decimal;
        productId: string;
        stockValue: Decimal;
        reason: string | null;
        warehouseId: string | null;
        category: string;
        actionDate: Date | null;
        lastSaleDate: Date | null;
        daysWithoutSale: number;
        lastPurchaseDate: Date | null;
        daysSincePurchase: number;
        actionRecommended: string | null;
        actionTaken: string | null;
        actionBy: string | null;
        identifiedAt: Date;
    }>;
}
