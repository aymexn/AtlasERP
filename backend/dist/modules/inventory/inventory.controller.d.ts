import { StockMovementService } from './services/stock-movement.service';
import { InventoryService } from './services/inventory.service';
import { CreateStockMovementDto } from './dto/create-movement.dto';
export declare class InventoryController {
    private readonly stockMovementService;
    private readonly inventoryService;
    constructor(stockMovementService: StockMovementService, inventoryService: InventoryService);
    createMovement(req: any, dto: CreateStockMovementDto): Promise<{
        id: string;
        reference: string;
        unit: string;
        createdAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    }>;
    listMovements(req: any): Promise<({
        product: {
            name: string;
            sku: string;
        };
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
        reference: string;
        unit: string;
        createdAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
    getStock(req: any, warehouseId?: string): Promise<{
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
    getProductsStockDashboard(req: any): Promise<{
        totalItems: number;
        totalStockValue: number;
        lowStockAlerts: number;
        outOfStock: number;
    }>;
    getAlerts(req: any): Promise<{
        id: string;
        unit: string;
        name: string;
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
        reference: string;
        unit: string;
        createdAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
}
