import { PrismaService } from '../prisma/prisma.service';
export declare class CollectionService {
    private prisma;
    constructor(prisma: PrismaService);
    getCollectionPriority(companyId: string): Promise<{
        id: any;
        name: any;
        totalOverdue: any;
        oldestInvoiceRef: any;
        daysOverdue: number;
        riskScore: number;
        lastActivity: any;
        paymentBehavior: any;
    }[]>;
    logActivity(companyId: string, data: any): Promise<{
        id: string;
        status: string;
        companyId: string;
        createdAt: Date;
        type: string;
        updatedAt: Date;
        notes: string | null;
        customerId: string;
        invoiceId: string | null;
        actionDate: Date;
        followUpDate: Date | null;
    }>;
    getActivities(companyId: string, customerId: string): Promise<({
        invoice: {
            id: string;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            reference: string;
            date: Date;
            salesOrderId: string | null;
            notes: string | null;
            customerId: string;
            totalAmountHt: import("@prisma/client/runtime/library").Decimal;
            totalAmountTva: import("@prisma/client/runtime/library").Decimal;
            totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            lastReminderSent: Date | null;
            reminderCount: number;
            totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            amountRemaining: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        };
    } & {
        id: string;
        status: string;
        companyId: string;
        createdAt: Date;
        type: string;
        updatedAt: Date;
        notes: string | null;
        customerId: string;
        invoiceId: string | null;
        actionDate: Date;
        followUpDate: Date | null;
    })[]>;
}
