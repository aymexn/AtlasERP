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
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        type: string;
        customerId: string;
        invoiceId: string | null;
        actionDate: Date;
        followUpDate: Date | null;
    }>;
    getActivities(companyId: string, customerId: string): Promise<({
        invoice: {
            id: string;
            reference: string;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            date: Date;
            salesOrderId: string | null;
            customerId: string;
            dueDate: Date | null;
            lastReminderSent: Date | null;
            reminderCount: number;
            totalAmountHt: import("@prisma/client/runtime/library").Decimal;
            totalAmountTva: import("@prisma/client/runtime/library").Decimal;
            totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
            totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            amountRemaining: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        };
    } & {
        id: string;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        type: string;
        customerId: string;
        invoiceId: string | null;
        actionDate: Date;
        followUpDate: Date | null;
    })[]>;
}
