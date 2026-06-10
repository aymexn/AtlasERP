import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
export declare class PaymentReminderService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationService);
    findOverdueInvoices(companyId: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            email: string | null;
            name: string;
            companyId: string;
            address: string | null;
            phone: string | null;
            taxId: string | null;
            notes: string | null;
            updatedAt: Date;
            isActive: boolean;
            contact: string | null;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            isBlocked: boolean;
            segment: import(".prisma/client").$Enums.CustomerSegment | null;
            customerType: import(".prisma/client").$Enums.CustomerType | null;
            paymentBehavior: import(".prisma/client").$Enums.PaymentBehavior | null;
            riskLevel: import(".prisma/client").$Enums.RiskLevel | null;
            totalRevenue: import("@prisma/client/runtime/library").Decimal;
            avgPaymentDelay: number;
        };
    } & {
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
    })[]>;
    sendReminder(invoiceId: string): Promise<void>;
    sendDailyReminders(companyId: string): Promise<{
        total: number;
    }>;
}
