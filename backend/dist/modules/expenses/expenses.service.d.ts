import { PrismaService } from '../prisma/prisma.service';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        supplier: {
            id: string;
            email: string | null;
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            address: string | null;
            ai: string | null;
            nif: string | null;
            phone: string | null;
            rc: string | null;
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
        updatedAt: Date;
        title: string;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    })[]>;
    findOne(companyId: string, id: string): Promise<{
        supplier: {
            id: string;
            email: string | null;
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            address: string | null;
            ai: string | null;
            nif: string | null;
            phone: string | null;
            rc: string | null;
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
        updatedAt: Date;
        title: string;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    create(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    update(companyId: string, id: string, data: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        reference: string | null;
        date: Date;
        notes: string | null;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
    }>;
    getStats(companyId: string): Promise<{
        category: string;
        total: number;
    }[]>;
}
