import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(req: any): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
    create(req: any, data: any): Promise<{
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
    update(req: any, id: string, data: any): Promise<{
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
    remove(req: any, id: string): Promise<{
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
