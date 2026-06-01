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
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        invoiceId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    })[]>;
    recordPayment(body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        invoiceId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
    }>;
}
