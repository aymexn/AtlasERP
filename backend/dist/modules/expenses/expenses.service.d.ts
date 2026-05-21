import { PrismaService } from '../prisma/prisma.service';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        supplier: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            name: string;
            isActive: boolean;
            code: string | null;
            address: string | null;
            ai: string | null;
            email: string | null;
            nif: string | null;
            phone: string | null;
            rc: string | null;
            city: string | null;
            country: string;
            taxId: string | null;
            paymentTermsDays: number;
            leadTimeDays: number;
        };
    } & {
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        category: string;
    })[]>;
    findOne(companyId: string, id: string): Promise<{
        supplier: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            name: string;
            isActive: boolean;
            code: string | null;
            address: string | null;
            ai: string | null;
            email: string | null;
            nif: string | null;
            phone: string | null;
            rc: string | null;
            city: string | null;
            country: string;
            taxId: string | null;
            paymentTermsDays: number;
            leadTimeDays: number;
        };
    } & {
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        category: string;
    }>;
    create(companyId: string, data: any): Promise<{
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        category: string;
    }>;
    update(companyId: string, id: string, data: any): Promise<{
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        category: string;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        date: Date;
        supplierId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        category: string;
    }>;
    getStats(companyId: string): Promise<{
        category: string;
        total: number;
    }[]>;
}
