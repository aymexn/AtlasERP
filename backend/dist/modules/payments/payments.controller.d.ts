import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(req: any): Promise<({
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
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    recordPayment(body: any, req: any): Promise<{
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        invoiceId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
