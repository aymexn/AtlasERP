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
        reference: string;
        unit: string;
        createdAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        quantity: Prisma.Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    }>;
    validateReception(companyId: string, userId: string, receptionId: string, tx?: Prisma.TransactionClient): Promise<void>;
    completeSalesOrder(companyId: string, userId: string, orderId: string, warehouseId: string): Promise<void>;
    completeManufacturingOrder(companyId: string, userId: string, moId: string, warehouseId: string, producedQty: number): Promise<{
        lines: ({
            component: {
                id: string;
                unit: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                name: string;
                isActive: boolean;
                description: string | null;
                sku: string;
                familyId: string | null;
                stockUomId: string | null;
                taxRate: Prisma.Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                minStock: Prisma.Decimal;
                reorderPoint: Prisma.Decimal;
                purchasePriceHt: Prisma.Decimal | null;
                secondaryName: string | null;
                barcode: string | null;
                internalReference: string | null;
                isBlocked: boolean;
                maxStock: Prisma.Decimal | null;
                salePriceHt: Prisma.Decimal | null;
                standardCost: Prisma.Decimal;
                stockQuantity: Prisma.Decimal;
                preferredSupplierId: string | null;
                stockValue: Prisma.Decimal;
                trackStock: boolean;
            };
        } & {
            id: string;
            unit: string;
            createdAt: Date;
            updatedAt: Date;
            variantId: string | null;
            bomComponentId: string | null;
            requiredQuantity: Prisma.Decimal;
            consumedQuantity: Prisma.Decimal;
            wastagePercent: Prisma.Decimal;
            estimatedUnitCost: Prisma.Decimal;
            estimatedLineCost: Prisma.Decimal;
            note: string | null;
            componentProductId: string;
            uomId: string | null;
            manufacturingOrderId: string;
        })[];
        product: {
            id: string;
            unit: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            name: string;
            isActive: boolean;
            description: string | null;
            sku: string;
            familyId: string | null;
            stockUomId: string | null;
            taxRate: Prisma.Decimal;
            articleType: import(".prisma/client").$Enums.ArticleType;
            minStock: Prisma.Decimal;
            reorderPoint: Prisma.Decimal;
            purchasePriceHt: Prisma.Decimal | null;
            secondaryName: string | null;
            barcode: string | null;
            internalReference: string | null;
            isBlocked: boolean;
            maxStock: Prisma.Decimal | null;
            salePriceHt: Prisma.Decimal | null;
            standardCost: Prisma.Decimal;
            stockQuantity: Prisma.Decimal;
            preferredSupplierId: string | null;
            stockValue: Prisma.Decimal;
            trackStock: boolean;
        };
    } & {
        id: string;
        reference: string;
        status: import(".prisma/client").$Enums.ManufacturingOrderStatus;
        plannedQuantity: Prisma.Decimal;
        producedQuantity: Prisma.Decimal;
        unit: string;
        plannedDate: Date;
        startedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        totalEstimatedCost: Prisma.Decimal;
        totalActualCost: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        formulaId: string;
        warehouseId: string | null;
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
        reference: string;
        unit: string;
        createdAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        quantity: Prisma.Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
    listMovements(companyId: string): Promise<({
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
        quantity: Prisma.Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
}
