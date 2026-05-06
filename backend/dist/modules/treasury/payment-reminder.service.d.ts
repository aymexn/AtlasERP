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
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            address: string | null;
            phone: string | null;
            updatedAt: Date;
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
    })[]>;
    sendReminder(invoiceId: string): Promise<void>;
    sendDailyReminders(companyId: string): Promise<{
        total: number;
    }>;
}
