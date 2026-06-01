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
            createdAt: Date;
            email: string | null;
            companyId: string;
            name: string;
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
    getStats(req: any): Promise<{
        category: string;
        total: number;
    }[]>;
    exportPdf(req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<{
        supplier: {
            id: string;
            createdAt: Date;
            email: string | null;
            companyId: string;
            name: string;
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
    create(body: any, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
