import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(req: any): Promise<({
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
        amount: import("@prisma/client/runtime/library").Decimal;
        invoiceId: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    recordPayment(body: any, req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        invoiceId: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
