import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(req: any, createDto: CreateSupplierDto): Promise<{
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
    list(req: any): Promise<({
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
    getStats(req: any): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, updateDto: UpdateSupplierDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
}
