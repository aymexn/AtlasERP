import { VariantsService } from './variants.service';
export declare class VariantsController {
    private readonly variantsService;
    constructor(variantsService: VariantsService);
    findAll(productId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        isActive: boolean;
        sku: string;
        productId: string;
        attributeValues: import("@prisma/client/runtime/library").JsonValue | null;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    create(productId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        isActive: boolean;
        sku: string;
        productId: string;
        attributeValues: import("@prisma/client/runtime/library").JsonValue | null;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
    }>;
    generateMatrix(productId: string, attributes: Record<string, string[]>): Promise<any[]>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        isActive: boolean;
        sku: string;
        productId: string;
        attributeValues: import("@prisma/client/runtime/library").JsonValue | null;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        isActive: boolean;
        sku: string;
        productId: string;
        attributeValues: import("@prisma/client/runtime/library").JsonValue | null;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
    }>;
}
