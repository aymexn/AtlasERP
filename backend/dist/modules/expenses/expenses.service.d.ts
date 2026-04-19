import { PrismaService } from '../prisma/prisma.service';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        supplier: {
            id: string;
            companyId: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            email: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            country: string;
            nif: string | null;
            ai: string | null;
            rc: string | null;
            taxId: string | null;
            paymentTermsDays: number;
            isActive: boolean;
        };
    } & {
        id: string;
        companyId: string;
        supplierId: string | null;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(companyId: string, id: string): Promise<{
        supplier: {
            id: string;
            companyId: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            email: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            country: string;
            nif: string | null;
            ai: string | null;
            rc: string | null;
            taxId: string | null;
            paymentTermsDays: number;
            isActive: boolean;
        };
    } & {
        id: string;
        companyId: string;
        supplierId: string | null;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        supplierId: string | null;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(companyId: string, id: string, data: any): Promise<{
        id: string;
        companyId: string;
        supplierId: string | null;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        companyId: string;
        supplierId: string | null;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(companyId: string): Promise<{
        category: string;
        total: number;
    }[]>;
}
