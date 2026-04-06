import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    list(companyId: string): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        city: string | null;
        country: string;
        taxId: string | null;
        paymentTermsDays: number;
        notes: string | null;
    }[]>;
    findOne(id: string, companyId: string): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        city: string | null;
        country: string;
        taxId: string | null;
        paymentTermsDays: number;
        notes: string | null;
    }>;
    create(companyId: string, dto: CreateSupplierDto): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        city: string | null;
        country: string;
        taxId: string | null;
        paymentTermsDays: number;
        notes: string | null;
    }>;
    update(id: string, companyId: string, dto: UpdateSupplierDto): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        city: string | null;
        country: string;
        taxId: string | null;
        paymentTermsDays: number;
        notes: string | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        email: string | null;
        companyId: string;
        createdAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        city: string | null;
        country: string;
        taxId: string | null;
        paymentTermsDays: number;
        notes: string | null;
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
