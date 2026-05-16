import { UomService } from './uom.service';
export declare class UomController {
    private readonly uomService;
    constructor(uomService: UomService);
    findAll(req: any): Promise<{
        symbol: string;
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        type: string;
    }[]>;
    create(req: any, data: any): Promise<{
        symbol: string;
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        type: string;
    }>;
    findOne(id: string, req: any): Promise<{
        symbol: string;
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        type: string;
    }>;
    update(id: string, req: any, data: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getProductUoms(productId: string): Promise<({
        uom: {
            symbol: string;
            id: string;
            companyId: string;
            name: string;
            isActive: boolean;
            type: string;
        };
    } & {
        id: string;
        createdAt: Date;
        productId: string;
        uomId: string;
        isDefault: boolean;
        conversionFactor: import("@prisma/client/runtime/library").Decimal;
        purpose: string | null;
    })[]>;
    addProductUom(productId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        uomId: string;
        isDefault: boolean;
        conversionFactor: import("@prisma/client/runtime/library").Decimal;
        purpose: string | null;
    }>;
    removeProductUom(id: string): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        uomId: string;
        isDefault: boolean;
        conversionFactor: import("@prisma/client/runtime/library").Decimal;
        purpose: string | null;
    }>;
}
