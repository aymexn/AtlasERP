import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(req: any, createDto: CreateSupplierDto): Promise<{
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
    }>;
    list(req: any): Promise<({
        _count: {
            expenses: number;
            purchaseOrders: number;
        };
    } & {
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
    }>;
    update(req: any, id: string, updateDto: UpdateSupplierDto): Promise<{
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
    }>;
    remove(req: any, id: string): Promise<{
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
    }>;
    getCatalog(id: string): Promise<({
        product: {
            id: string;
            unit: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            name: string;
            isActive: boolean;
            description: string | null;
            sku: string;
            familyId: string | null;
            stockUomId: string | null;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            articleType: import(".prisma/client").$Enums.ArticleType;
            minStock: import("@prisma/client/runtime/library").Decimal;
            reorderPoint: import("@prisma/client/runtime/library").Decimal;
            purchasePriceHt: import("@prisma/client/runtime/library").Decimal | null;
            secondaryName: string | null;
            barcode: string | null;
            internalReference: string | null;
            isBlocked: boolean;
            maxStock: import("@prisma/client/runtime/library").Decimal | null;
            salePriceHt: import("@prisma/client/runtime/library").Decimal | null;
            standardCost: import("@prisma/client/runtime/library").Decimal;
            stockQuantity: import("@prisma/client/runtime/library").Decimal;
            preferredSupplierId: string | null;
            stockValue: import("@prisma/client/runtime/library").Decimal;
            trackStock: boolean;
        };
    } & {
        id: string;
        notes: string | null;
        createdAt: Date;
        productId: string;
        supplierId: string;
        leadTimeDays: number | null;
        supplierSku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        minOrderQuantity: import("@prisma/client/runtime/library").Decimal;
        isPreferred: boolean;
    })[]>;
    addProductToCatalog(id: string, data: any): Promise<{
        id: string;
        notes: string | null;
        createdAt: Date;
        productId: string;
        supplierId: string;
        leadTimeDays: number | null;
        supplierSku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        minOrderQuantity: import("@prisma/client/runtime/library").Decimal;
        isPreferred: boolean;
    }>;
    removeProductFromCatalog(id: string): Promise<{
        id: string;
        notes: string | null;
        createdAt: Date;
        productId: string;
        supplierId: string;
        leadTimeDays: number | null;
        supplierSku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        minOrderQuantity: import("@prisma/client/runtime/library").Decimal;
        isPreferred: boolean;
    }>;
}
