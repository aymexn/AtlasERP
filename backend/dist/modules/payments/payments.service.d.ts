import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        invoice: {
            customer: {
                name: string;
            };
            reference: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    recordPayment(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
