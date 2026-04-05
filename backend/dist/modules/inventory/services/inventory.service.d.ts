import { PrismaService } from '../../prisma/prisma.service';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getProductsStock(companyId: string, warehouseId?: string): Promise<({
        product: {
            name: string;
            sku: string;
            standardCost: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            family: {
                name: string;
            };
        };
    } & {
        id: string;
        companyId: string;
        updatedAt: Date;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        warehouseId: string;
        reservedQuantity: import("@prisma/client/runtime/library").Decimal;
        minThreshold: import("@prisma/client/runtime/library").Decimal;
        maxThreshold: import("@prisma/client/runtime/library").Decimal | null;
    })[] | {
        id: string;
        name: string;
        sku: string;
        standardCost: import("@prisma/client/runtime/library").Decimal;
        stockQuantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        minStock: import("@prisma/client/runtime/library").Decimal;
        maxStock: import("@prisma/client/runtime/library").Decimal;
        stockValue: import("@prisma/client/runtime/library").Decimal;
        family: {
            name: string;
        };
    }[]>;
    getInventorySummary(companyId: string): Promise<{
        totalItems: number;
        totalStockValue: number;
        lowStockAlerts: number;
        outOfStock: number;
    }>;
    getLowStockAlerts(companyId: string): Promise<{
        id: string;
        name: string;
        sku: string;
        stockQuantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        minStock: import("@prisma/client/runtime/library").Decimal;
    }[]>;
}
