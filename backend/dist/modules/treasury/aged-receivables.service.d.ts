import { PrismaService } from '../prisma/prisma.service';
export declare class AgedReceivablesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAgedReceivables(companyId: string): Promise<{
        summary: {
            totalOutstanding: number;
            current: number;
            late30: number;
            late60: number;
            late90: number;
        };
        customers: any[];
    }>;
    getCustomerAging(companyId: string, customerId: string): Promise<{
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
}
