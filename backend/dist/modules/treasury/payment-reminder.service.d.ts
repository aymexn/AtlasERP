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
            updatedAt: Date;
            companyId: string;
            name: string;
            isActive: boolean;
            address: string | null;
            email: string | null;
            phone: string | null;
            taxId: string | null;
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
    })[]>;
    sendReminder(invoiceId: string): Promise<void>;
    sendDailyReminders(companyId: string): Promise<{
        total: number;
    }>;
}
