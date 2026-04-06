import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class SalesOrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
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
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
    })[]>;
    findOne(companyId: string, id: string): Promise<{
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
            creditLimit: Prisma.Decimal;
        };
        lines: ({
            product: {
                id: string;
                companyId: string;
                createdAt: Date;
                name: string;
                description: string | null;
                sku: string;
                salePriceHt: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                standardCost: Prisma.Decimal;
                stockQuantity: Prisma.Decimal;
                familyId: string | null;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                secondaryName: string | null;
                purchasePriceHt: Prisma.Decimal | null;
                minStock: Prisma.Decimal;
                isActive: boolean;
                trackStock: boolean;
                internalReference: string | null;
                barcode: string | null;
                maxStock: Prisma.Decimal | null;
                stockValue: Prisma.Decimal;
                isBlocked: boolean;
                updatedAt: Date;
                preferredSupplierId: string | null;
            };
        } & {
            id: string;
            taxRate: Prisma.Decimal;
            unit: string;
            productId: string;
            quantity: Prisma.Decimal;
            salesOrderId: string;
            shippedQuantity: Prisma.Decimal;
            unitPriceHt: Prisma.Decimal;
            unitCostSnapshot: Prisma.Decimal;
            lineTotalHt: Prisma.Decimal;
            lineTotalTtc: Prisma.Decimal;
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
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
    }>;
    create(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.SalesOrderStatus;
        customerId: string;
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
    }>;
    ship(companyId: string, userId: string, id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.SalesOrderStatus;
        customerId: string;
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
    }>;
    getProfitability(companyId: string, id: string): Promise<{
        orderId: string;
        reference: string;
        totalRevenue: number;
        totalCost: number;
        totalMargin: number;
        marginPercent: number;
        details: {
            product: string;
            quantity: Prisma.Decimal;
            revenue: number;
            cost: number;
            margin: number;
            marginPercent: number;
        }[];
    }>;
}
