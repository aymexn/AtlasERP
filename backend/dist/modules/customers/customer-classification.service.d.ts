import { PrismaService } from '../prisma/prisma.service';
export declare class CustomerClassificationService {
    private prisma;
    constructor(prisma: PrismaService);
    recalculateCustomerStats(companyId: string, customerId: string): Promise<void>;
    recalculateAllCustomers(companyId: string): Promise<void>;
}
