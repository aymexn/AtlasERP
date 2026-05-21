import { PrismaService } from '../../prisma/prisma.service';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getProductsStock(companyId: string, warehouseId?: string): Promise<{
        quantity: number;
        stockQuantity: number;
        minStock: number;
        reservedQuantity: number;
        availableQuantity: number;
        product: {
            id: string;
            unit: string;
            name: string;
            sku: string;
            minStock: import("@prisma/client/runtime/library").Decimal;
            standardCost: import("@prisma/client/runtime/library").Decimal;
            family: {
                name: string;
            };
        };
        id: string;
        updatedAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        warehouseId: string;
        minThreshold: import("@prisma/client/runtime/library").Decimal;
        maxThreshold: import("@prisma/client/runtime/library").Decimal | null;
    }[] | {
        stockQuantity: number;
        reservedQuantity: number;
        availableQuantity: number;
        id: string;
        unit: string;
        name: string;
        sku: string;
        minStock: import("@prisma/client/runtime/library").Decimal;
        purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
        maxStock: import("@prisma/client/runtime/library").Decimal;
        standardCost: import("@prisma/client/runtime/library").Decimal;
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
        unit: string;
        name: string;
        sku: string;
        minStock: import("@prisma/client/runtime/library").Decimal;
        stockQuantity: import("@prisma/client/runtime/library").Decimal;
    }[]>;
}
