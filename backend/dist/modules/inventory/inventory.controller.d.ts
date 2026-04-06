import { StockMovementService } from './services/stock-movement.service';
import { InventoryService } from './services/inventory.service';
import { CreateStockMovementDto } from './dto/create-movement.dto';
export declare class InventoryController {
    private readonly stockMovementService;
    private readonly inventoryService;
    constructor(stockMovementService: StockMovementService, inventoryService: InventoryService);
    createMovement(req: any, dto: CreateStockMovementDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        unit: string;
        reference: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        sourceLocation: string | null;
        destinationLocation: string | null;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        salesOrderId: string | null;
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
        companyId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        unit: string;
        reference: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        sourceLocation: string | null;
        destinationLocation: string | null;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        salesOrderId: string | null;
    })[]>;
    getStock(req: any, warehouseId?: string): Promise<({
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
    getProductsStockDashboard(req: any): Promise<{
        totalItems: number;
        totalStockValue: number;
        lowStockAlerts: number;
        outOfStock: number;
    }>;
    getAlerts(req: any): Promise<{
        id: string;
        name: string;
        sku: string;
        stockQuantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        minStock: import("@prisma/client/runtime/library").Decimal;
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
        companyId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        unit: string;
        reference: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        sourceLocation: string | null;
        destinationLocation: string | null;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        salesOrderId: string | null;
    })[]>;
}
