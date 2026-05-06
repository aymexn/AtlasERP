import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(req: any, createDto: CreateSupplierDto): Promise<{
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
    list(req: any): Promise<({
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
    update(req: any, id: string, updateDto: UpdateSupplierDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
}
