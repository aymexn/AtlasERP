import { FormulaService } from './formula.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
export declare class FormulaController {
    private readonly formulaService;
    constructor(formulaService: FormulaService);
    getProductFormulas(productId: string, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getFormula(id: string, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    createFormula(productId: string, dto: CreateFormulaDto, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateFormula(id: string, dto: UpdateFormulaDto, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    activateFormula(id: string, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    archiveFormula(id: string, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    addLine(id: string, dto: CreateFormulaLineDto, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateLine(lineId: string, dto: UpdateFormulaLineDto, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    removeLine(lineId: string, req: any): Promise<{
        components: {
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
            updatedAt: Date;
            unit: string;
            sortOrder: number;
            bomId: string;
            componentProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.FormulaStatus;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        productId: string;
        version: string;
        code: string | null;
        outputQuantity: import("@prisma/client/runtime/library").Decimal;
        outputUnit: string;
        scrapPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
}
