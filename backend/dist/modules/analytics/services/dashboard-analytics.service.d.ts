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
            name: string;
            unit: import(".prisma/client").$Enums.ProductUnit;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        unit: string;
        productId: string;
        variantId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        uomId: string | null;
        movementType: string;
        reference: string;
        reason: string | null;
        date: Date;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        createdBy: string | null;
        warehouseFromId: string | null;
        warehouseToId: string | null;
        salesOrderId: string | null;
    })[]>;
    private getStartDateForPeriod;
}
