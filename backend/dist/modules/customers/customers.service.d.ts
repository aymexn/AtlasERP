import { PrismaService } from '../prisma/prisma.service';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        taxId: string | null;
        contact: string | null;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    findOne(companyId: string, id: string): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        taxId: string | null;
        contact: string | null;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(companyId: string, data: any): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        taxId: string | null;
        contact: string | null;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(companyId: string, id: string, data: any): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        taxId: string | null;
        contact: string | null;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        taxId: string | null;
        contact: string | null;
        creditLimit: import("@prisma/client/runtime/library").Decimal;
    }>;
}
