import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardAnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getKPIs(companyId: string, period?: string): Promise<{
        revenue: number;
        revenueChange: number;
        margin: number;
        activeOrders: number;
        stockOutRate: number;
    }>;
    getImminentRupture(companyId: string): Promise<any[]>;
    getSurstock(companyId: string): Promise<any[]>;
    getPaymentDelays(companyId: string): Promise<({
        customer: {
            name: string;
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
    getProductionBottlenecks(companyId: string): Promise<any[]>;
    getRevenueEvolution(companyId: string, days?: number): Promise<{
        date: string;
        amount: number;
    }[]>;
    getTopProducts(companyId: string, limit?: number): Promise<{
        name: string;
        totalRevenue: number;
        totalQuantity: number;
        productId: string;
    }[]>;
    getCategoryDistribution(companyId: string): Promise<{
        name: string;
        value: number;
    }[]>;
    getRecentTransactions(companyId: string, limit?: number): Promise<({
        product: {
            unit: string;
            name: string;
        };
    } & {
        id: string;
        reference: string;
        unit: string;
        createdAt: Date;
        companyId: string;
        productId: string;
        variantId: string | null;
        uomId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import(".prisma/client").$Enums.MovementType;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        movementType: string;
        reason: string | null;
        date: Date;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
    private getStartDateForPeriod;
}
