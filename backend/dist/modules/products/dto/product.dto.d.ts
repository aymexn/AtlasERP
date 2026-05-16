import { ArticleType } from '@prisma/client';
export declare class CreateProductDto {
    name: string;
    sku: string;
    salePriceHt: number;
    taxRate?: number;
    standardCost: number;
    stockQuantity?: number;
    familyId?: string;
    articleType?: ArticleType;
    unit?: string;
    secondaryName?: string;
    description?: string;
    purchasePriceHt?: number;
    minStock?: number;
    isActive?: boolean;
    trackStock?: boolean;
    stockUomId?: string;
    formulaLines?: {
        componentId: string;
        quantity: number;
    }[];
}
export declare class UpdateProductDto {
    name?: string;
    sku?: string;
    salePriceHt?: number;
    taxRate?: number;
    standardCost?: number;
    stockQuantity?: number;
    familyId?: string;
    articleType?: ArticleType;
    unit?: string;
    secondaryName?: string;
    description?: string;
    purchasePriceHt?: number;
    minStock?: number;
    isActive?: boolean;
    trackStock?: boolean;
    stockUomId?: string;
    formulaLines?: {
        componentId: string;
        quantity: number;
    }[];
}
