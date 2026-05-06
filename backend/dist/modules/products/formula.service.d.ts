import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
export declare class FormulaService {
    private prisma;
    constructor(prisma: PrismaService);
    private calculateProductProductionCost;
    private getFormulaWithDetails;
    getProductFormulas(productId: string, companyId: string): Promise<{
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
    getFormula(id: string, companyId: string): Promise<{
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
    createFormula(productId: string, companyId: string, dto: CreateFormulaDto, tx?: any): Promise<{
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
    updateFormula(formulaId: string, companyId: string, dto: UpdateFormulaDto, tx?: any): Promise<{
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
    updateFormulaStatus(formulaId: string, companyId: string, status: string): Promise<{
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
    addLine(formulaId: string, companyId: string, dto: CreateFormulaLineDto): Promise<{
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
    updateLine(lineId: string, companyId: string, dto: UpdateFormulaLineDto): Promise<{
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
    removeLine(lineId: string, companyId: string): Promise<{
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
