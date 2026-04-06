import { PrismaService } from '../prisma/prisma.service';
export declare class StockReceptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(companyId: string): Promise<({
        warehouse: {
            name: string;
        };
        purchaseOrder: {
            supplier: {
                name: string;
            };
            reference: string;
        };
        _count: {
            lines: number;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        warehouseId: string;
        purchaseOrderId: string;
        receivedAt: Date;
    })[]>;
    findOne(id: string, companyId: string): Promise<{
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
                address: string | null;
                phone: string | null;
                isActive: boolean;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string;
            notes: string | null;
            status: import(".prisma/client").$Enums.PurchaseOrderStatus;
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
                description: string | null;
                sku: string;
                salePriceHt: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                familyId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                secondaryName: string | null;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
                minStock: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                trackStock: boolean;
                internalReference: string | null;
                barcode: string | null;
                maxStock: import("@prisma/client/runtime/library").Decimal | null;
                stockValue: import("@prisma/client/runtime/library").Decimal;
                isBlocked: boolean;
                updatedAt: Date;
                preferredSupplierId: string | null;
            };
        } & {
            id: string;
            unit: string;
            productId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receptionId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        warehouseId: string;
        purchaseOrderId: string;
        receivedAt: Date;
    }>;
    validate(id: string, companyId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.ReceptionStatus;
        warehouseId: string;
        purchaseOrderId: string;
        receivedAt: Date;
    }>;
}
