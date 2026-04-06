import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getProductionStats(companyId: string): Promise<{
        orders: {
            active: number;
            planned: number;
            inProgress: number;
            completed: number;
            draft: number;
        };
        costs: {
            estimated: number;
            actual: number;
            variance: number;
        };
        procurement: {
            pendingValue: number;
            pendingCount: number;
            rawMaterialValue: number;
            topSuppliers: {
                name: string;
                value: number;
            }[];
        };
        sales: {
            monthlyRevenue: number;
            activeOrders: number;
            customerCount: number;
            topSellingProducts: {
                name: any;
                quantity: number;
                revenue: number;
            }[];
        };
        finances: {
            totalRevenue: number;
            totalExpenses: number;
            totalCogs: number;
            netProfit: number;
            cashPosition: number;
            receipts: number;
        };
        recentActivity: ({
            product: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            reference: string;
            productId: string;
            notes: string | null;
            status: import(".prisma/client").$Enums.ManufacturingOrderStatus;
            formulaId: string;
            plannedQuantity: import("@prisma/client/runtime/library").Decimal;
            plannedDate: Date;
            producedQuantity: import("@prisma/client/runtime/library").Decimal;
            startedAt: Date | null;
            completedAt: Date | null;
            totalEstimatedCost: import("@prisma/client/runtime/library").Decimal;
            totalActualCost: import("@prisma/client/runtime/library").Decimal | null;
        })[];
    }>;
}
