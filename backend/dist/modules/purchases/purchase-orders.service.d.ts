import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/purchase-order.dto';
import { PurchaseOrderStatus } from '@prisma/client';
export declare class PurchaseOrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateReference;
    list(companyId: string, status?: PurchaseOrderStatus): Promise<({
        supplier: {
            name: string;
        };
        _count: {
            stockReceptions: number;
            lines: number;
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
    })[]>;
    findOne(id: string, companyId: string): Promise<{
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
        stockReceptions: ({
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
        })[];
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
            taxRate: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            unitPriceHt: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
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
    }>;
    create(companyId: string, dto: CreatePurchaseOrderDto): Promise<{
        lines: {
            id: string;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
            totalHt: import("@prisma/client/runtime/library").Decimal;
            unitPriceHt: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        }[];
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
    }>;
    confirm(id: string, companyId: string): Promise<{
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
    }>;
    send(id: string, companyId: string): Promise<{
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
    }>;
    cancel(id: string, companyId: string): Promise<{
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
    }>;
    createReception(id: string, companyId: string, warehouseId: string, notes?: string): Promise<{
        lines: {
            id: string;
            unit: string;
            productId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseLineId: string | null;
            expectedQty: import("@prisma/client/runtime/library").Decimal;
            receptionId: string;
        }[];
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
}
