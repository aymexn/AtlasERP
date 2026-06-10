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
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        invoiceId: string;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    recordPayment(companyId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        invoiceId: string;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
