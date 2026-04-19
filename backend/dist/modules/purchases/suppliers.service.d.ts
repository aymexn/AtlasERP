import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    list(companyId: string): Promise<({
        _count: {
            purchaseOrders: number;
            expenses: number;
        };
    } & {
        id: string;
        companyId: string;
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
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, companyId: string): Promise<{
        _count: {
            purchaseOrders: number;
            expenses: number;
        };
    } & {
        id: string;
        companyId: string;
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
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(companyId: string, dto: CreateSupplierDto): Promise<{
        id: string;
        companyId: string;
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
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, companyId: string, dto: UpdateSupplierDto): Promise<{
        id: string;
        companyId: string;
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
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        companyId: string;
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
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(companyId: string): Promise<{
        totalSuppliers: number;
        activeSuppliers: number;
        suppliersWithOrders: {
            id: string;
            name: string;
            _count: {
                purchaseOrders: number;
            };
        }[];
    }>;
}
