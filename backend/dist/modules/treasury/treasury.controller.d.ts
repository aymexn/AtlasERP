import { AgedReceivablesService } from './aged-receivables.service';
import { PaymentReminderService } from './payment-reminder.service';
import { CollectionService } from './collection.service';
import { CashFlowService } from './cash-flow.service';
export declare class TreasuryController {
    private readonly agedService;
    private readonly reminderService;
    private readonly collectionService;
    private readonly cashFlowService;
    constructor(agedService: AgedReceivablesService, reminderService: PaymentReminderService, collectionService: CollectionService, cashFlowService: CashFlowService);
    getAgedReceivables(req: any): Promise<{
        summary: {
            totalOutstanding: number;
            current: number;
            late30: number;
            late60: number;
            late90: number;
        };
        customers: any[];
    }>;
    getCustomerAging(req: any, id: string): Promise<{
        customer: {
            id: string;
            name: string;
            totalRevenue: import("@prisma/client/runtime/library").Decimal;
            paymentBehavior: import(".prisma/client").$Enums.PaymentBehavior;
        };
        buckets: {
            current: any[];
            late30: any[];
            late60: any[];
            late90: any[];
        };
    }>;
    sendReminder(invoiceId: string): Promise<void>;
    sendDailyReminders(req: any): Promise<{
        total: number;
    }>;
    getCollectionPriority(req: any): Promise<{
        id: any;
        name: any;
        totalOverdue: any;
        oldestInvoiceRef: any;
        daysOverdue: number;
        riskScore: number;
        lastActivity: any;
        paymentBehavior: any;
    }[]>;
    logActivity(req: any, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        notes: string;
        customerId: string;
        invoiceId: string | null;
        activityType: string;
        outcome: string | null;
        nextAction: Date | null;
        assignedTo: string | null;
    }>;
    getActivities(req: any, customerId: string): Promise<({
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
        companyId: string;
        createdAt: Date;
        notes: string;
        customerId: string;
        invoiceId: string | null;
        activityType: string;
        outcome: string | null;
        nextAction: Date | null;
        assignedTo: string | null;
    })[]>;
    getForecast(req: any): Promise<any[]>;
}
