import { PrismaService } from '../prisma/prisma.service';
export declare class UomService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<{
        symbol: string;
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        type: string;
    }[]>;
    findOne(id: string, companyId: string): Promise<{
        symbol: string;
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        type: string;
    }>;
    create(companyId: string, data: any): Promise<{
        symbol: string;
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        type: string;
    }>;
    update(id: string, companyId: string, data: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
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
    convert(quantity: number, fromUomId: string, toUomId: string, productId: string): Promise<number>;
}
