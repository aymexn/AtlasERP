import { PrismaService } from '../prisma/prisma.service';
export declare class CashFlowService {
    private prisma;
    constructor(prisma: PrismaService);
    get30DayForecast(companyId: string): Promise<any[]>;
}
