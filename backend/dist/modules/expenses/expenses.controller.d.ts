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
    getStats(req: any): Promise<{
        category: string;
        total: number;
    }[]>;
    exportPdf(req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<{
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
    create(body: any, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
