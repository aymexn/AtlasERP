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
        createdAt: Date;
        companyId: string;
        createdBy: string | null;
        reason: string | null;
        salesOrderId: string | null;
        reference: string;
        date: Date;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        uomId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        variantId: string | null;
        movementType: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        warehouseFromId: string | null;
        warehouseToId: string | null;
    })[]>;
    private getStartDateForPeriod;
}
