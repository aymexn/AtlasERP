import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { StockMovementService } from '../inventory/services/stock-movement.service';
export declare class SuppliersService {
    private prisma;
    private stockMovementService;
    constructor(prisma: PrismaService, stockMovementService: StockMovementService);
    list(companyId: string): Promise<({
        _count: {
            expenses: number;
            purchaseOrders: number;
        };
    } & {
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
    })[]>;
    private generateReference;
    findOne(id: string, companyId: string): Promise<{
        _count: {
            expenses: number;
            purchaseOrders: number;
        };
    } & {
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
    }>;
    create(companyId: string, dto: CreateSupplierDto): Promise<{
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
    }>;
    update(id: string, companyId: string, dto: UpdateSupplierDto): Promise<{
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
    }>;
    remove(id: string, companyId: string): Promise<{
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
