import { ExpensesService } from './expenses.service';
import { PdfService } from '../../common/services/pdf.service';
import { TenantsService } from '../tenants/tenants.service';
import { Response } from 'express';
export declare class ExpensesController {
    private readonly expensesService;
    private readonly pdfService;
    private readonly tenantsService;
    constructor(expensesService: ExpensesService, pdfService: PdfService, tenantsService: TenantsService);
    findAll(req: any): Promise<({
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
    getStats(req: any): Promise<{
        category: string;
        total: number;
    }[]>;
    exportPdf(req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<{
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
    create(body: any, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
