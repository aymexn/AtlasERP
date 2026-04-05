import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockMovementDto } from '../dto/create-movement.dto';
export declare class StockMovementService {
    private prisma;
    constructor(prisma: PrismaService);
    createMovement(companyId: string, userId: string, dto: CreateStockMovementDto): Promise<{
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
    }>;
    private updateStock;
    private generateReference;
    getProductMovementHistory(productId: string, companyId: string): Promise<({
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
    })[]>;
    listMovements(companyId: string): Promise<({
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
    })[]>;
}
