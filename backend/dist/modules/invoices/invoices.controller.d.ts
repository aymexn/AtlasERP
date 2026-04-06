import { InvoicesService } from './invoices.service';
import { PdfService } from '../../common/services/pdf.service';
import { Response } from 'express';
export declare class InvoicesController {
    private readonly invoicesService;
    private readonly pdfService;
    constructor(invoicesService: InvoicesService, pdfService: PdfService);
    findAll(req: any): Promise<({
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
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date | null;
        totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        amountRemaining: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    findOne(id: string, req: any): Promise<{
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
            creditLimit: import("@prisma/client/runtime/library").Decimal;
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
        };
        payments: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string | null;
            date: Date;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date | null;
        totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        amountRemaining: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    }>;
    createFromSalesOrder(body: {
        salesOrderId: string;
        paymentMethod: any;
    }, req: any): Promise<{
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
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date | null;
        totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        amountRemaining: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    }>;
    cancel(id: string, req: any): Promise<{
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
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date | null;
        totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        amountRemaining: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    }>;
    generatePdf(id: string, req: any, res: Response): Promise<void>;
}
