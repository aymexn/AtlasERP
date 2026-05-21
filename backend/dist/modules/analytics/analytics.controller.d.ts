import { AbcClassificationService } from './services/abc-classification.service';
import { StockTurnoverService } from './services/stock-turnover.service';
import { DeadStockService } from './services/dead-stock.service';
import { ReorderPointService } from './services/reorder-point.service';
import { SupplierPerformanceService } from './services/supplier-performance.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
export declare class AnalyticsController {
    private abcService;
    private turnoverService;
    private deadStockService;
    private reorderService;
    private supplierService;
    private dashboardService;
    constructor(abcService: AbcClassificationService, turnoverService: StockTurnoverService, deadStockService: DeadStockService, reorderService: ReorderPointService, supplierService: SupplierPerformanceService, dashboardService: DashboardAnalyticsService);
    getKpis(req: any, period?: string): Promise<{
        revenue: number;
        revenueChange: number;
        margin: number;
        activeOrders: number;
        stockOutRate: number;
    }>;
    getImminentRupture(req: any): Promise<any[]>;
    getSurstock(req: any): Promise<any[]>;
    getPaymentDelays(req: any): Promise<({
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
    getProductionBottlenecks(req: any): Promise<any[]>;
    getRevenueEvolution(req: any, days?: number): Promise<{
        date: string;
        amount: number;
    }[]>;
    getTopProducts(req: any, limit?: number): Promise<{
        name: string;
        totalRevenue: number;
        totalQuantity: number;
        productId: string;
    }[]>;
    getCategoryDistribution(req: any): Promise<{
        name: string;
        value: number;
    }[]>;
    getRecentTransactions(req: any, limit?: number): Promise<({
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
    calculateAbc(req: any, body: {
        startDate: string;
        endDate: string;
    }): Promise<{
        success: boolean;
        message: string;
        summary?: undefined;
    } | {
        success: boolean;
        summary: {
            totalProducts: number;
            aItems: number;
            bItems: number;
            cItems: number;
            totalRevenue: any;
        };
        message?: undefined;
    }>;
    getAbcSummary(req: any): Promise<unknown>;
    getAbcProducts(req: any, classification: string, limit?: number): Promise<({
        product: {
            name: string;
            sku: string;
            family: {
                name: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        productId: string;
        periodStart: Date;
        periodEnd: Date;
        classification: string;
        annualRevenue: import("@prisma/client/runtime/library").Decimal;
        annualUnitsSold: number;
        revenuePercentage: import("@prisma/client/runtime/library").Decimal;
        cumulativeRevenuePercentage: import("@prisma/client/runtime/library").Decimal;
        averageStockValue: import("@prisma/client/runtime/library").Decimal;
        stockTurnoverRate: import("@prisma/client/runtime/library").Decimal;
        daysInStock: import("@prisma/client/runtime/library").Decimal;
        classifiedAt: Date;
    })[]>;
    identifyDeadStock(req: any, body: {
        daysThreshold?: number;
    }): Promise<{
        success: boolean;
        summary: {
            totalItems: number;
            totalValue: any;
            byCategory: {
                slowMoving: number;
                deadStock: number;
                obsolete: number;
            };
        };
    }>;
    getDeadStockReport(req: any, category?: string): Promise<{
        items: ({
            product: {
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
            };
            warehouse: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            productId: string;
            warehouseId: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            stockValue: import("@prisma/client/runtime/library").Decimal;
            reason: string | null;
            category: string;
            actionDate: Date | null;
            lastSaleDate: Date | null;
            daysWithoutSale: number;
            lastPurchaseDate: Date | null;
            daysSincePurchase: number;
            actionRecommended: string | null;
            actionTaken: string | null;
            actionBy: string | null;
            identifiedAt: Date;
        })[];
        summary: {
            totalItems: number;
            totalValue: number;
            byCategory: {
                slowMoving: number;
                deadStock: number;
                obsolete: number;
            };
        };
    }>;
    markDeadStockAction(req: any, id: string, body: {
        action: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        productId: string;
        warehouseId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        stockValue: import("@prisma/client/runtime/library").Decimal;
        reason: string | null;
        category: string;
        actionDate: Date | null;
        lastSaleDate: Date | null;
        daysWithoutSale: number;
        lastPurchaseDate: Date | null;
        daysSincePurchase: number;
        actionRecommended: string | null;
        actionTaken: string | null;
        actionBy: string | null;
        identifiedAt: Date;
    }>;
    getReorderAlerts(req: any): Promise<unknown>;
    calculateReorderPoint(req: any, productId: string, body: {
        warehouseId?: string;
        serviceLevel?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        productId: string;
        warehouseId: string | null;
        reorderPoint: import("@prisma/client/runtime/library").Decimal;
        leadTimeDays: number | null;
        safetyStock: import("@prisma/client/runtime/library").Decimal;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal;
        maximumStock: import("@prisma/client/runtime/library").Decimal | null;
        averageDailyDemand: import("@prisma/client/runtime/library").Decimal | null;
        demandVariability: import("@prisma/client/runtime/library").Decimal | null;
        serviceLevel: import("@prisma/client/runtime/library").Decimal;
        autoCalculate: boolean;
        calculationMethod: string | null;
        lastCalculatedAt: Date | null;
        alertEnabled: boolean;
        alertThreshold: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getSupplierRankings(req: any, startDate: string, endDate: string): Promise<({
        supplier: {
            name: string;
            email: string;
            phone: string;
        };
    } & {
        id: string;
        notes: string | null;
        createdAt: Date;
        companyId: string;
        supplierId: string;
        periodStart: Date;
        periodEnd: Date;
        totalOrders: number;
        onTimeDeliveries: number;
        lateDeliveries: number;
        averageDelayDays: import("@prisma/client/runtime/library").Decimal | null;
        onTimeDeliveryRate: import("@prisma/client/runtime/library").Decimal | null;
        totalItemsReceived: import("@prisma/client/runtime/library").Decimal | null;
        defectiveItems: import("@prisma/client/runtime/library").Decimal | null;
        returnedItems: import("@prisma/client/runtime/library").Decimal | null;
        qualityAcceptanceRate: import("@prisma/client/runtime/library").Decimal | null;
        totalPurchaseValue: import("@prisma/client/runtime/library").Decimal | null;
        averageOrderValue: import("@prisma/client/runtime/library").Decimal | null;
        paymentTermsComplianceRate: import("@prisma/client/runtime/library").Decimal | null;
        priceCompetitivenessScore: import("@prisma/client/runtime/library").Decimal | null;
        discountRate: import("@prisma/client/runtime/library").Decimal | null;
        overallPerformanceScore: import("@prisma/client/runtime/library").Decimal | null;
        performanceGrade: string | null;
        recommendedStatus: string | null;
        calculatedAt: Date;
    })[]>;
}
