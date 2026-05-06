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
    getStats(req: any): Promise<{
        category: string;
        total: number;
    }[]>;
    exportPdf(req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<{
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
    create(body: any, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
