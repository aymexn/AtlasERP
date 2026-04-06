import { SalesOrdersService } from './sales-orders.service';
export declare class SalesOrdersController {
    private readonly salesOrdersService;
    constructor(salesOrdersService: SalesOrdersService);
    findAll(req: any): Promise<({
        customer: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.SalesOrderStatus;
        customerId: string;
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(req: any, id: string): Promise<{
        customer: {
            id: string;
            email: string | null;
            companyId: string;
            createdAt: Date;
            name: string;
            address: string | null;
            phone: string | null;
            isActive: boolean;
            updatedAt: Date;
            taxId: string | null;
            contact: string | null;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
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
            taxRate: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            salesOrderId: string;
            shippedQuantity: import("@prisma/client/runtime/library").Decimal;
            unitPriceHt: import("@prisma/client/runtime/library").Decimal;
            unitCostSnapshot: import("@prisma/client/runtime/library").Decimal;
            lineTotalHt: import("@prisma/client/runtime/library").Decimal;
            lineTotalTtc: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.SalesOrderStatus;
        customerId: string;
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(req: any, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.SalesOrderStatus;
        customerId: string;
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
    }>;
    ship(req: any, id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.SalesOrderStatus;
        customerId: string;
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
    }>;
    getProfitability(req: any, id: string): Promise<{
        orderId: string;
        reference: string;
        totalRevenue: number;
        totalCost: number;
        totalMargin: number;
        marginPercent: number;
        details: {
            product: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            revenue: number;
            cost: number;
            margin: number;
            marginPercent: number;
        }[];
    }>;
}
