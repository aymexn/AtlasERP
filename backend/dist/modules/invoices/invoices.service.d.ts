import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, Prisma } from '@prisma/client';
export declare class InvoicesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        customer: {
            name: string;
        };
        salesOrder: {
            reference: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        salesOrderId: string | null;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
        dueDate: Date | null;
        totalAmountStamp: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        amountRemaining: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    findOne(companyId: string, id: string): Promise<{
        company: {
            id: string;
            email: string | null;
            createdAt: Date;
            name: string;
            slug: string;
            address: string | null;
            phone: string | null;
            website: string | null;
            logoUrl: string | null;
            nif: string | null;
            ai: string | null;
            rc: string | null;
            rib: string | null;
            allowNegativeStock: boolean;
        };
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
        salesOrder: {
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
        };
        payments: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string | null;
            date: Date;
            notes: string | null;
            amount: Prisma.Decimal;
            invoiceId: string;
            method: import(".prisma/client").$Enums.PaymentMethod;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        salesOrderId: string | null;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
        dueDate: Date | null;
        totalAmountStamp: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        amountRemaining: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    }>;
    calculateFiscalTotals(totalHt: Prisma.Decimal, totalTva: Prisma.Decimal, method: PaymentMethod): {
        totalHt: Prisma.Decimal;
        totalTva: Prisma.Decimal;
        totalStamp: Prisma.Decimal;
        totalTtc: Prisma.Decimal;
    };
    createFromSalesOrder(companyId: string, salesOrderId: string, paymentMethod?: PaymentMethod): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        salesOrderId: string | null;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
        dueDate: Date | null;
        totalAmountStamp: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        amountRemaining: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    }>;
    generatePdf(companyId: string, id: string): Promise<Buffer>;
    cancel(companyId: string, id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string;
        date: Date;
        salesOrderId: string | null;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        customerId: string;
        totalAmountHt: Prisma.Decimal;
        totalAmountTva: Prisma.Decimal;
        totalAmountTtc: Prisma.Decimal;
        dueDate: Date | null;
        totalAmountStamp: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        amountRemaining: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
