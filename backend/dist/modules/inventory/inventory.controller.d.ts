import { StockMovementService } from './services/stock-movement.service';
import { InventoryService } from './services/inventory.service';
import { CreateStockMovementDto } from './dto/create-movement.dto';
export declare class InventoryController {
    private readonly stockMovementService;
    private readonly inventoryService;
    constructor(stockMovementService: StockMovementService, inventoryService: InventoryService);
    createMovement(req: any, dto: CreateStockMovementDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
    }>;
    listMovements(req: any): Promise<({
        user: {
            email: string;
        };
        product: {
            name: string;
            sku: string;
        };
        warehouseFrom: {
            name: string;
        };
        warehouseTo: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
    })[]>;
    getStock(req: any, warehouseId?: string): Promise<{
        quantity: number;
        stockQuantity: number;
        minStock: number;
        reservedQuantity: number;
        availableQuantity: number;
        product: {
            id: string;
            name: string;
            unit: import(".prisma/client").$Enums.ProductUnit;
            sku: string;
            minStock: import("@prisma/client/runtime/library").Decimal;
            standardCost: import("@prisma/client/runtime/library").Decimal;
            family: {
                name: string;
            };
        };
        id: string;
        companyId: string;
        updatedAt: Date;
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
        name: string;
        unit: import(".prisma/client").$Enums.ProductUnit;
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
    getProductsStockDashboard(req: any): Promise<{
        totalItems: number;
        totalStockValue: number;
        lowStockAlerts: number;
        outOfStock: number;
    }>;
    getAlerts(req: any): Promise<{
        id: string;
        name: string;
        unit: import(".prisma/client").$Enums.ProductUnit;
        sku: string;
        minStock: import("@prisma/client/runtime/library").Decimal;
        stockQuantity: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getProductHistory(productId: string, req: any): Promise<({
        user: {
            email: string;
        };
        warehouseFrom: {
            name: string;
        };
        warehouseTo: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
    })[]>;
}
