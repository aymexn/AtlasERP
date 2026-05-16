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
        companyId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        unit: string;
        quantity: Prisma.Decimal;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        movementType: string;
        reference: string;
        reason: string | null;
        date: Date;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    }>;
    validateReception(companyId: string, userId: string, receptionId: string, tx?: Prisma.TransactionClient): Promise<void>;
    completeSalesOrder(companyId: string, userId: string, orderId: string, warehouseId: string): Promise<void>;
    completeManufacturingOrder(companyId: string, userId: string, moId: string, warehouseId: string, producedQty: number): Promise<{
        product: {
            id: string;
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            updatedAt: Date;
            sku: string;
            salePriceHt: Prisma.Decimal | null;
            taxRate: Prisma.Decimal;
            standardCost: Prisma.Decimal;
            stockQuantity: Prisma.Decimal;
            familyId: string | null;
            articleType: import(".prisma/client").$Enums.ArticleType;
            unit: string;
            secondaryName: string | null;
            purchasePriceHt: Prisma.Decimal | null;
            minStock: Prisma.Decimal;
            trackStock: boolean;
            stockUomId: string | null;
            barcode: string | null;
            internalReference: string | null;
            isBlocked: boolean;
            maxStock: Prisma.Decimal | null;
            preferredSupplierId: string | null;
            stockValue: Prisma.Decimal;
        };
        lines: ({
            component: {
                id: string;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                description: string | null;
                updatedAt: Date;
                sku: string;
                salePriceHt: Prisma.Decimal | null;
                taxRate: Prisma.Decimal;
                standardCost: Prisma.Decimal;
                stockQuantity: Prisma.Decimal;
                familyId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                secondaryName: string | null;
                purchasePriceHt: Prisma.Decimal | null;
                minStock: Prisma.Decimal;
                trackStock: boolean;
                stockUomId: string | null;
                barcode: string | null;
                internalReference: string | null;
                isBlocked: boolean;
                maxStock: Prisma.Decimal | null;
                preferredSupplierId: string | null;
                stockValue: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            unit: string;
            componentProductId: string;
            wastagePercent: Prisma.Decimal;
            note: string | null;
            variantId: string | null;
            uomId: string | null;
            manufacturingOrderId: string;
            bomComponentId: string | null;
            requiredQuantity: Prisma.Decimal;
            consumedQuantity: Prisma.Decimal;
            estimatedUnitCost: Prisma.Decimal;
            estimatedLineCost: Prisma.Decimal;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ManufacturingOrderStatus;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        unit: string;
        productId: string;
        variantId: string | null;
        reference: string;
        notes: string | null;
        warehouseId: string | null;
        completedAt: Date | null;
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
        companyId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        unit: string;
        quantity: Prisma.Decimal;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        movementType: string;
        reference: string;
        reason: string | null;
        date: Date;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
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
        quantity: Prisma.Decimal;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        movementType: string;
        reference: string;
        reason: string | null;
        date: Date;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
}
