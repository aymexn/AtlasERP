import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
export declare class FormulaService {
    private prisma;
    constructor(prisma: PrismaService);
    private getFormulaWithDetails;
    getProductFormulas(productId: string, companyId: string): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }[]>;
    getFormula(id: string, companyId: string): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
    createFormula(productId: string, companyId: string, dto: CreateFormulaDto): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
    updateFormula(formulaId: string, companyId: string, dto: UpdateFormulaDto): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
    updateFormulaStatus(formulaId: string, companyId: string, status: string): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
    addLine(formulaId: string, companyId: string, dto: CreateFormulaLineDto): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
    updateLine(lineId: string, companyId: string, dto: UpdateFormulaLineDto): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
    removeLine(lineId: string, companyId: string): Promise<{
        lines: {
            calculatedCost: number;
            wastageCost: number;
            costPerUnit: number;
            component: {
                id: string;
                name: string;
                sku: string;
                standardCost: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: import("@prisma/client/runtime/library").Decimal;
                articleType: import(".prisma/client").$Enums.ArticleType;
                unit: string;
                purchasePriceHt: import("@prisma/client/runtime/library").Decimal;
                family: {
                    name: string;
                };
            };
            id: string;
            createdAt: Date;
            unit: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            formulaId: string;
            componentProductId: string;
            wastagePercent: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        costSummary: {
            theoreticalMaterialCost: number;
            totalWastageImpact: number;
            outputUnitCost: number;
            effectiveBatchCost: number;
            totalLines: number;
        };
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        productId: string;
        code: string | null;
        version: string;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.FormulaStatus;
    }>;
}
