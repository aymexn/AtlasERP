import { StockReceptionsService } from './stock-receptions.service';
export declare class StockReceptionsController {
    private readonly stockReceptionsService;
    constructor(stockReceptionsService: StockReceptionsService);
    list(req: any): Promise<({
        warehouse: {
            id: string;
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            updatedAt: Date;
            code: string | null;
            location: string | null;
        };
        purchaseOrder: {
            supplier: {
                id: string;
                email: string | null;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                address: string | null;
                ai: string | null;
                nif: string | null;
                phone: string | null;
                rc: string | null;
                updatedAt: Date;
                code: string | null;
                city: string | null;
                country: string;
                taxId: string | null;
                paymentTermsDays: number;
                notes: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string;
            notes: string | null;
            supplierId: string;
            orderDate: Date;
            expectedDate: Date | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            totalTva: import("@prisma/client/runtime/library").Decimal;
            totalTtc: import("@prisma/client/runtime/library").Decimal;
        };
        _count: {
            lines: number;
        };
        lines: ({
            product: {
                id: string;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                description: string | null;
                updatedAt: Date;
                sku: string;
                salePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                familyId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                secondaryName: string | null;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                minStock: import("@prisma/client/runtime/library").Decimal;
                trackStock: boolean;
                barcode: string | null;
                internalReference: string | null;
                isBlocked: boolean;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                preferredSupplierId: string | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            unit: string;
            productId: string;
            note: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receptionId: string;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        notes: string | null;
        purchaseOrderId: string;
        warehouseId: string;
        receivedAt: Date;
        validatedAt: Date | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
        warehouse: {
            id: string;
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            updatedAt: Date;
            code: string | null;
            location: string | null;
        };
        purchaseOrder: {
            supplier: {
                id: string;
                email: string | null;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                address: string | null;
                ai: string | null;
                nif: string | null;
                phone: string | null;
                rc: string | null;
                updatedAt: Date;
                code: string | null;
                city: string | null;
                country: string;
                taxId: string | null;
                paymentTermsDays: number;
                notes: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string;
            notes: string | null;
            supplierId: string;
            orderDate: Date;
            expectedDate: Date | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            totalTva: import("@prisma/client/runtime/library").Decimal;
            totalTtc: import("@prisma/client/runtime/library").Decimal;
        };
        lines: ({
            product: {
                id: string;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                description: string | null;
                updatedAt: Date;
                sku: string;
                salePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                familyId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                secondaryName: string | null;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                minStock: import("@prisma/client/runtime/library").Decimal;
                trackStock: boolean;
                barcode: string | null;
                internalReference: string | null;
                isBlocked: boolean;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                preferredSupplierId: string | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            unit: string;
            productId: string;
            note: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receptionId: string;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        notes: string | null;
        purchaseOrderId: string;
        warehouseId: string;
        receivedAt: Date;
        validatedAt: Date | null;
    }>;
    validate(req: any, id: string): Promise<{
        purchaseOrder: {
            supplier: {
                id: string;
                email: string | null;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                address: string | null;
                ai: string | null;
                nif: string | null;
                phone: string | null;
                rc: string | null;
                updatedAt: Date;
                code: string | null;
                city: string | null;
                country: string;
                taxId: string | null;
                paymentTermsDays: number;
                notes: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string;
            notes: string | null;
            supplierId: string;
            orderDate: Date;
            expectedDate: Date | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            totalTva: import("@prisma/client/runtime/library").Decimal;
            totalTtc: import("@prisma/client/runtime/library").Decimal;
        };
        lines: ({
            product: {
                id: string;
                companyId: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
                description: string | null;
                updatedAt: Date;
                sku: string;
                salePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                familyId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                secondaryName: string | null;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                minStock: import("@prisma/client/runtime/library").Decimal;
                trackStock: boolean;
                barcode: string | null;
                internalReference: string | null;
                isBlocked: boolean;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                preferredSupplierId: string | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            unit: string;
            productId: string;
            note: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            receptionId: string;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        notes: string | null;
        purchaseOrderId: string;
        warehouseId: string;
        receivedAt: Date;
        validatedAt: Date | null;
    }>;
}
