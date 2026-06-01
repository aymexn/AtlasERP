import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockMovementDto } from '../dto/create-movement.dto';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../../notifications/notifications.service';
import { UomService } from '../../products/uom.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class StockMovementService {
    private prisma;
    private notificationService;
    private uomService;
    private eventEmitter;
    constructor(prisma: PrismaService, notificationService: NotificationService, uomService: UomService, eventEmitter: EventEmitter2);
    createMovement(companyId: string, userId: string | null, dto: CreateStockMovementDto, tx?: Prisma.TransactionClient): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: Prisma.Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
    }>;
    validateReception(companyId: string, userId: string, receptionId: string, tx?: Prisma.TransactionClient): Promise<void>;
    completeSalesOrder(companyId: string, userId: string, orderId: string, warehouseId: string): Promise<void>;
    completeManufacturingOrder(companyId: string, userId: string, moId: string, warehouseId: string, producedQty: number): Promise<{
        product: {
            id: string;
            createdAt: Date;
            companyId: string;
            name: string;
            description: string | null;
            updatedAt: Date;
            reorderPoint: Prisma.Decimal;
            isActive: boolean;
            isBlocked: boolean;
            unit: import(".prisma/client").$Enums.ProductUnit;
            taxRate: Prisma.Decimal;
            sku: string;
            familyId: string | null;
            stockUomId: string | null;
            articleType: import(".prisma/client").$Enums.ArticleType;
            minStock: Prisma.Decimal;
            purchasePriceHt: Prisma.Decimal | null;
            secondaryName: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            barcode: string | null;
            internalReference: string | null;
            maxStock: Prisma.Decimal | null;
            salePriceHt: Prisma.Decimal | null;
            standardCost: Prisma.Decimal;
            stockQuantity: Prisma.Decimal;
            stockReserved: Prisma.Decimal;
            preferredSupplierId: string | null;
            stockValue: Prisma.Decimal;
            trackStock: boolean;
        };
        lines: ({
            component: {
                id: string;
                createdAt: Date;
                companyId: string;
                name: string;
                description: string | null;
                updatedAt: Date;
                reorderPoint: Prisma.Decimal;
                isActive: boolean;
                isBlocked: boolean;
                unit: import(".prisma/client").$Enums.ProductUnit;
                taxRate: Prisma.Decimal;
                sku: string;
                familyId: string | null;
                stockUomId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                minStock: Prisma.Decimal;
                purchasePriceHt: Prisma.Decimal | null;
                secondaryName: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                barcode: string | null;
                internalReference: string | null;
                maxStock: Prisma.Decimal | null;
                salePriceHt: Prisma.Decimal | null;
                standardCost: Prisma.Decimal;
                stockQuantity: Prisma.Decimal;
                stockReserved: Prisma.Decimal;
                preferredSupplierId: string | null;
                stockValue: Prisma.Decimal;
                trackStock: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            unit: string;
            uomId: string | null;
            variantId: string | null;
            note: string | null;
            manufacturingOrderId: string;
            componentProductId: string;
            bomComponentId: string | null;
            requiredQuantity: Prisma.Decimal;
            consumedQuantity: Prisma.Decimal;
            wastagePercent: Prisma.Decimal;
            estimatedUnitCost: Prisma.Decimal;
            estimatedLineCost: Prisma.Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ManufacturingOrderStatus;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        completedAt: Date | null;
        reference: string;
        productId: string;
        unit: string;
        variantId: string | null;
        warehouseId: string | null;
        formulaId: string;
        plannedQuantity: Prisma.Decimal;
        producedQuantity: Prisma.Decimal;
        plannedDate: Date;
        startedAt: Date | null;
        totalEstimatedCost: Prisma.Decimal;
        totalActualCost: Prisma.Decimal | null;
    }>;
    private deductStockFromAnyWarehouse;
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
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: Prisma.Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
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
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: Prisma.Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
    })[]>;
}
