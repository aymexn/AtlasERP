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
        createdAt: Date;
        status: string;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        customerId: string;
        type: string;
        actionDate: Date;
        invoiceId: string | null;
        followUpDate: Date | null;
    }>;
    getActivities(companyId: string, customerId: string): Promise<({
        invoice: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            companyId: string;
            notes: string | null;
            updatedAt: Date;
            dueDate: Date | null;
            totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
            totalAmountHt: import("@prisma/client/runtime/library").Decimal;
            totalAmountTva: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            salesOrderId: string | null;
            customerId: string;
            reference: string;
            date: Date;
            lastReminderSent: Date | null;
            reminderCount: number;
            totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
            amountRemaining: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        customerId: string;
        type: string;
        actionDate: Date;
        invoiceId: string | null;
        followUpDate: Date | null;
    })[]>;
}
