import { ExpensesService } from './expenses.service';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(req: any): Promise<({
        supplier: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    })[]>;
    getStats(req: any): Promise<{
        category: string;
        total: number;
    }[]>;
    findOne(id: string, req: any): Promise<{
        supplier: {
            id: string;
            email: string | null;
            companyId: string;
            createdAt: Date;
            name: string;
            address: string | null;
            phone: string | null;
            isActive: boolean;
            updatedAt: Date;
            code: string | null;
            city: string | null;
            country: string;
            taxId: string | null;
            paymentTermsDays: number;
            notes: string | null;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    create(body: any, req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    update(id: string, body: any, req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
}
