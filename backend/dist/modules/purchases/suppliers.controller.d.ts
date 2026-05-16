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
        leadTimeDays: number;
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
        leadTimeDays: number;
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
        leadTimeDays: number;
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
        leadTimeDays: number;
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
        leadTimeDays: number;
        notes: string | null;
    }>;
    getCatalog(id: string): Promise<({
        product: {
            id: string;
            companyId: string;
            createdAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            updatedAt: Date;
            sku: string;
            salePriceHt: import("@prisma/client/runtime/library").Decimal | null;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            standardCost: import("@prisma/client/runtime/library").Decimal;
            stockQuantity: import("@prisma/client/runtime/library").Decimal;
            familyId: string | null;
            articleType: import(".prisma/client").$Enums.ArticleType;
            unit: string;
            secondaryName: string | null;
            purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
            minStock: import("@prisma/client/runtime/library").Decimal;
            trackStock: boolean;
            stockUomId: string | null;
            barcode: string | null;
            internalReference: string | null;
            isBlocked: boolean;
            maxStock: import("@prisma/client/runtime/library").Decimal | null;
            preferredSupplierId: string | null;
            stockValue: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        productId: string;
        leadTimeDays: number | null;
        notes: string | null;
        supplierId: string;
        supplierSku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        minOrderQuantity: import("@prisma/client/runtime/library").Decimal;
        isPreferred: boolean;
    })[]>;
    addProductToCatalog(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        leadTimeDays: number | null;
        notes: string | null;
        supplierId: string;
        supplierSku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        minOrderQuantity: import("@prisma/client/runtime/library").Decimal;
        isPreferred: boolean;
    }>;
    removeProductFromCatalog(id: string): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        leadTimeDays: number | null;
        notes: string | null;
        supplierId: string;
        supplierSku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        minOrderQuantity: import("@prisma/client/runtime/library").Decimal;
        isPreferred: boolean;
    }>;
}
