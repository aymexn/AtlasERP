import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class PaymentsService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
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
        method: import(".prisma/client").$Enums.PaymentMethod;
        amount: Prisma.Decimal;
        invoiceId: string;
    })[]>;
    recordPayment(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        amount: Prisma.Decimal;
        invoiceId: string;
    }>;
}
