import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class SupplierPerformanceService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculatePerformance(companyId: string, supplierId: string, startDate: Date, endDate: Date): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        notes: string | null;
        supplierId: string;
        periodStart: Date;
        periodEnd: Date;
        totalOrders: number;
        onTimeDeliveries: number;
        lateDeliveries: number;
        averageDelayDays: Decimal | null;
        onTimeDeliveryRate: Decimal | null;
        totalItemsReceived: Decimal | null;
        defectiveItems: Decimal | null;
        returnedItems: Decimal | null;
        qualityAcceptanceRate: Decimal | null;
        totalPurchaseValue: Decimal | null;
        averageOrderValue: Decimal | null;
        paymentTermsComplianceRate: Decimal | null;
        priceCompetitivenessScore: Decimal | null;
        discountRate: Decimal | null;
        overallPerformanceScore: Decimal | null;
        performanceGrade: string | null;
        recommendedStatus: string | null;
        calculatedAt: Date;
    }>;
    getRankings(companyId: string, startDate: Date, endDate: Date): Promise<({
        supplier: {
            email: string;
            name: string;
            phone: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        notes: string | null;
        supplierId: string;
        periodStart: Date;
        periodEnd: Date;
        totalOrders: number;
        onTimeDeliveries: number;
        lateDeliveries: number;
        averageDelayDays: Decimal | null;
        onTimeDeliveryRate: Decimal | null;
        totalItemsReceived: Decimal | null;
        defectiveItems: Decimal | null;
        returnedItems: Decimal | null;
        qualityAcceptanceRate: Decimal | null;
        totalPurchaseValue: Decimal | null;
        averageOrderValue: Decimal | null;
        paymentTermsComplianceRate: Decimal | null;
        priceCompetitivenessScore: Decimal | null;
        discountRate: Decimal | null;
        overallPerformanceScore: Decimal | null;
        performanceGrade: string | null;
        recommendedStatus: string | null;
        calculatedAt: Date;
    })[]>;
}
