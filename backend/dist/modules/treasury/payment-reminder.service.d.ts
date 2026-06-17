import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
export declare class PaymentReminderService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationService);
    findOverdueInvoices(companyId: string): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            companyId: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
            isBlocked: boolean;
            taxId: string | null;
            notes: string | null;
            contact: string | null;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            segment: import(".prisma/client").$Enums.CustomerSegment | null;
            customerType: import(".prisma/client").$Enums.CustomerType | null;
            paymentBehavior: import(".prisma/client").$Enums.PaymentBehavior | null;
            riskLevel: import(".prisma/client").$Enums.RiskLevel | null;
            totalRevenue: import("@prisma/client/runtime/library").Decimal;
            avgPaymentDelay: number;
        };
    } & {
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
        dueDate: Date | null;
        totalAmountHt: import("@prisma/client/runtime/library").Decimal;
        totalAmountTva: import("@prisma/client/runtime/library").Decimal;
        totalAmountTtc: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        lastReminderSent: Date | null;
        reminderCount: number;
        totalAmountStamp: import("@prisma/client/runtime/library").Decimal;
        amountRemaining: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    sendReminder(invoiceId: string): Promise<void>;
    sendDailyReminders(companyId: string): Promise<{
        total: number;
    }>;
}
