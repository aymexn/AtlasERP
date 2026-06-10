import { PrismaService } from '../prisma/prisma.service';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        supplier: {
            id: string;
            createdAt: Date;
            email: string | null;
            name: string;
            companyId: string;
            address: string | null;
            phone: string | null;
            taxId: string | null;
            notes: string | null;
            updatedAt: Date;
            code: string | null;
            ai: string | null;
            nif: string | null;
            rc: string | null;
            isActive: boolean;
            leadTimeDays: number;
            city: string | null;
            country: string;
            paymentTermsDays: number;
        };
    } & {
        id: string;
        title: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        category: string;
        reference: string | null;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        supplierId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(companyId: string, id: string): Promise<{
        supplier: {
            id: string;
            createdAt: Date;
            email: string | null;
            name: string;
            companyId: string;
            address: string | null;
            phone: string | null;
            taxId: string | null;
            notes: string | null;
            updatedAt: Date;
            code: string | null;
            ai: string | null;
            nif: string | null;
            rc: string | null;
            isActive: boolean;
            leadTimeDays: number;
            city: string | null;
            country: string;
            paymentTermsDays: number;
        };
    } & {
        id: string;
        title: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        category: string;
        reference: string | null;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        supplierId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(companyId: string, data: any): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        category: string;
        reference: string | null;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        supplierId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(companyId: string, id: string, data: any): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        category: string;
        reference: string | null;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        supplierId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        updatedAt: Date;
        category: string;
        reference: string | null;
        date: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        supplierId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getStats(companyId: string): Promise<{
        category: string;
        total: number;
    }[]>;
}
