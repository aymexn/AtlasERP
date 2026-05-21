import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class PaymentsService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    findAll(companyId: string): Promise<({
        invoice: {
            reference: string;
            customer: {
                name: string;
            };
        };
    } & {
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        invoiceId: string;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    recordPayment(companyId: string, data: any): Promise<{
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        invoiceId: string;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
