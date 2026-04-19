import { FormulaService } from './formula.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
export declare class FormulaController {
    private readonly formulaService;
    constructor(formulaService: FormulaService);
    getProductFormulas(productId: string, req: any): Promise<{
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
    getFormula(id: string, req: any): Promise<{
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
    createFormula(productId: string, dto: CreateFormulaDto, req: any): Promise<{
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
    updateFormula(id: string, dto: UpdateFormulaDto, req: any): Promise<{
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
    activateFormula(id: string, req: any): Promise<{
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
    archiveFormula(id: string, req: any): Promise<{
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
    addLine(id: string, dto: CreateFormulaLineDto, req: any): Promise<{
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
    updateLine(lineId: string, dto: UpdateFormulaLineDto, req: any): Promise<{
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
    removeLine(lineId: string, req: any): Promise<{
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
