import { PrismaService } from '../prisma/prisma.service';
export declare class StockReceptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(companyId: string): Promise<({
        purchaseOrder: {
            supplier: {
                id: string;
                companyId: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string | null;
                email: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                country: string;
                nif: string | null;
                ai: string | null;
                rc: string | null;
                taxId: string | null;
                paymentTermsDays: number;
                isActive: boolean;
            };
        } & {
            id: string;
            companyId: string;
            reference: string;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            supplierId: string;
            orderDate: Date;
            expectedDate: Date | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            totalTva: import("@prisma/client/runtime/library").Decimal;
            totalTtc: import("@prisma/client/runtime/library").Decimal;
        };
        warehouse: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            isActive: boolean;
            location: string | null;
        };
        lines: ({
            product: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                unit: string;
                sku: string;
                internalReference: string | null;
                barcode: string | null;
                secondaryName: string | null;
                description: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                salePriceHt: import("@prisma/client/runtime/library").Decimal;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                minStock: import("@prisma/client/runtime/library").Decimal;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
                isBlocked: boolean;
                trackStock: boolean;
                familyId: string | null;
                preferredSupplierId: string | null;
            };
        } & {
            id: string;
            receptionId: string;
            productId: string;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
        _count: {
            lines: number;
        };
    } & {
        id: string;
        companyId: string;
        reference: string;
        purchaseOrderId: string;
        warehouseId: string;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, companyId: string): Promise<{
        purchaseOrder: {
            supplier: {
                id: string;
                companyId: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string | null;
                email: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                country: string;
                nif: string | null;
                ai: string | null;
                rc: string | null;
                taxId: string | null;
                paymentTermsDays: number;
                isActive: boolean;
            };
        } & {
            id: string;
            companyId: string;
            reference: string;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            supplierId: string;
            orderDate: Date;
            expectedDate: Date | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            totalTva: import("@prisma/client/runtime/library").Decimal;
            totalTtc: import("@prisma/client/runtime/library").Decimal;
        };
        warehouse: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            isActive: boolean;
            location: string | null;
        };
        lines: ({
            product: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                unit: string;
                sku: string;
                internalReference: string | null;
                barcode: string | null;
                secondaryName: string | null;
                description: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                salePriceHt: import("@prisma/client/runtime/library").Decimal;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                minStock: import("@prisma/client/runtime/library").Decimal;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
                isBlocked: boolean;
                trackStock: boolean;
                familyId: string | null;
                preferredSupplierId: string | null;
            };
        } & {
            id: string;
            receptionId: string;
            productId: string;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        reference: string;
        purchaseOrderId: string;
        warehouseId: string;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validate(id: string, companyId: string): Promise<{
        purchaseOrder: {
            supplier: {
                id: string;
                companyId: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string | null;
                email: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                country: string;
                nif: string | null;
                ai: string | null;
                rc: string | null;
                taxId: string | null;
                paymentTermsDays: number;
                isActive: boolean;
            };
        } & {
            id: string;
            companyId: string;
            reference: string;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
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
                updatedAt: Date;
                name: string;
                isActive: boolean;
                unit: string;
                sku: string;
                internalReference: string | null;
                barcode: string | null;
                secondaryName: string | null;
                description: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                salePriceHt: import("@prisma/client/runtime/library").Decimal;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                minStock: import("@prisma/client/runtime/library").Decimal;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
                isBlocked: boolean;
                trackStock: boolean;
                familyId: string | null;
                preferredSupplierId: string | null;
            };
        } & {
            id: string;
            receptionId: string;
            productId: string;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        reference: string;
        purchaseOrderId: string;
        warehouseId: string;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
