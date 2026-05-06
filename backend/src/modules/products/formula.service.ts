import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
import { ArticleType } from '@prisma/client';

@Injectable()
export class FormulaService {
    constructor(private prisma: PrismaService) { }

    private async calculateProductProductionCost(productId: string, companyId: string, tx?: any) {
        const prisma = tx || this.prisma;

        // Get the active formula for this product
        const formula = await prisma.billOfMaterials.findFirst({
            where: { productId, companyId, isActive: true },
            include: {
                components: {
                    include: {
                        component: {
                            select: {
                                standardCost: true,
                                purchasePriceHt: true
                            }
                        }
                    }
                }
            }
        });

        if (!formula || !formula.components || formula.components.length === 0) return null;

        let totalCost = 0;
        for (const line of formula.components) {
            const costPerUnit = Number(line.component?.standardCost) || Number(line.component?.purchasePriceHt) || 0;
            const quantity = Number(line.quantity) || 0;
            const wastagePercent = Number(line.wastagePercent) || 0;
            const quantityWithWastage = quantity * (1 + (wastagePercent / 100));
            
            totalCost += quantityWithWastage * costPerUnit;
        }

        const outputQuantity = Number(formula.outputQuantity) || 1;
        const unitCost = outputQuantity > 0 ? totalCost / outputQuantity : 0;

        // Update product standardCost
        await prisma.product.update({
            where: { id: productId },
            data: { standardCost: unitCost }
        });

        return unitCost;
    }

    private async getFormulaWithDetails(id: string, companyId?: string) {
        const whereClause: any = { id };
        if (companyId) whereClause.companyId = companyId;

        const formula = await this.prisma.billOfMaterials.findFirst({
            where: whereClause,
            include: {
                components: {
                    include: {
                        component: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                                standardCost: true,
                                purchasePriceHt: true,
                                stockQuantity: true,
                                articleType: true,
                                family: {
                                    select: { name: true }
                                }
                            }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        if (!formula) return null;

        let theoreticalMaterialCost = 0;
        let totalWastageImpact = 0;

        const enrichedLines = formula.components.map(line => {
            const costPerUnit = Number(line.component?.standardCost) || Number(line.component?.purchasePriceHt) || 0;
            const quantity = Number(line.quantity) || 0;
            const wastagePercent = Number(line.wastagePercent) || 0;
            const quantityWithWastage = quantity * (1 + (wastagePercent / 100));
            
            const lineCost = quantityWithWastage * costPerUnit;
            const wastageCost = (quantityWithWastage - quantity) * costPerUnit;

            theoreticalMaterialCost += lineCost;
            totalWastageImpact += wastageCost;

            return {
                ...line,
                calculatedCost: lineCost,
                wastageCost,
                costPerUnit
            };
        });

        const outputQuantity = Number(formula.outputQuantity) || 1;
        const outputUnitCost = outputQuantity > 0 ? theoreticalMaterialCost / outputQuantity : 0;

        return {
            ...formula,
            components: enrichedLines,
            costSummary: {
                theoreticalMaterialCost,
                totalWastageImpact,
                outputUnitCost,
                effectiveBatchCost: theoreticalMaterialCost,
                totalLines: enrichedLines.length
            }
        };
    }

    async getProductFormulas(productId: string, companyId: string) {
        const formulas = await this.prisma.billOfMaterials.findMany({
            where: { productId, companyId },
            orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
        });
        
        const details = await Promise.all(formulas.map(f => this.getFormulaWithDetails(f.id, companyId)));
        return details.filter(f => f !== null);
    }

    async getFormula(id: string, companyId: string) {
        return this.getFormulaWithDetails(id, companyId);
    }

    async createFormula(productId: string, companyId: string, dto: CreateFormulaDto, tx?: any) {
        const prisma = tx || this.prisma;
        // Verify product belongs to company and is of right type
        const product = await prisma.product.findUnique({
            where: { id: productId, companyId }
        });

        if (!product) throw new NotFoundException('Product not found');
        if (product.articleType !== ArticleType.FINISHED_PRODUCT && product.articleType !== ArticleType.SEMI_FINISHED) {
            throw new ForbiddenException('Only finished or semi-finished products can have formulas');
        }

        const { lines, ...formulaData } = dto;

        if (lines && lines.length > 0) {
            const hasSelf = lines.some(l => l.componentProductId === productId);
            if (hasSelf) throw new ForbiddenException('A product cannot be a component of its own formula');

            const componentIds = lines.map(l => l.componentProductId);
            const components = await this.prisma.product.findMany({
                where: { id: { in: componentIds }, companyId }
            });
            
            const hasRestricted = components.some(c => c.articleType === ArticleType.SERVICE);
            if (hasRestricted) throw new ForbiddenException('Service articles cannot be components');
        }

        const createdFormula = await prisma.billOfMaterials.create({
            data: {
                name: formulaData.name,
                version: formulaData.version,
                code: formulaData.code,
                description: formulaData.description,
                outputQuantity: formulaData.outputQuantity,
                outputUnit: formulaData.outputUnit,
                scrapPercent: formulaData.scrapPercent,
                status: formulaData.status as any,
                isActive: formulaData.isActive,
                
                product: { connect: { id: productId } },
                company: { connect: { id: companyId } },
                
                components: lines ? {
                    create: lines.map(line => ({
                        quantity: line.quantity,
                        unit: line.unit,
                        wastagePercent: line.wastagePercent,
                        sortOrder: line.sortOrder,
                        note: line.note,
                        component: { connect: { id: line.componentProductId } }
                    }))
                } : undefined
            }
        });

        if (createdFormula.isActive || createdFormula.status === 'ACTIVE') {
            await this.calculateProductProductionCost(productId, companyId, tx);
        }
        
        return this.getFormulaWithDetails(createdFormula.id, companyId);
    }

    async updateFormula(formulaId: string, companyId: string, dto: UpdateFormulaDto, tx?: any) {
        const prisma = tx || this.prisma;
        const formula = await prisma.billOfMaterials.findFirst({
            where: { id: formulaId, companyId }
        });

        if (!formula) throw new NotFoundException('Formula not found');

        const { lines, ...formulaData } = dto;

        const performUpdate = async (currentTx: any) => {
            const p = currentTx || this.prisma;
            await p.billOfMaterials.update({
                where: { id: formula.id },
                data: {
                    ...formulaData,
                    status: formulaData.status as any
                }
            });

            if (lines !== undefined) {
                await p.bOMComponent.deleteMany({
                    where: { bomId: formula.id }
                });

                if (lines.length > 0) {
                    await p.bOMComponent.createMany({
                        data: lines.map((line: any) => ({
                            bomId: formula.id,
                            componentProductId: line.componentProductId,
                            quantity: line.quantity,
                            unit: line.unit,
                            wastagePercent: line.wastagePercent || 0,
                            sortOrder: line.sortOrder || 0,
                            note: line.note
                        }))
                    });
                }
            }

            const updatedFormula = await p.billOfMaterials.findUnique({ where: { id: formula.id } });
            if (updatedFormula && (updatedFormula.isActive || updatedFormula.status === 'ACTIVE')) {
                await this.calculateProductProductionCost(formula.productId, companyId, currentTx);
            }

            return this.getFormulaWithDetails(formula.id, companyId);
        };

        if (tx) {
            return performUpdate(tx);
        } else {
            return this.prisma.$transaction(async (newTx) => performUpdate(newTx));
        }
    }

    async updateFormulaStatus(formulaId: string, companyId: string, status: string) {
        const formula = await this.prisma.billOfMaterials.findFirst({
            where: { id: formulaId, companyId }
        });

        if (!formula) throw new NotFoundException('Formula not found');

        if (status === 'ACTIVE') {
            await this.prisma.billOfMaterials.updateMany({
                where: { productId: formula.productId, companyId, id: { not: formula.id } },
                data: { status: 'ARCHIVED', isActive: false }
            });
        }

        await this.prisma.billOfMaterials.update({
            where: { id: formula.id },
            data: { status: status as any, isActive: status === 'ACTIVE' }
        });

        // Always recalculate cost when status changes to ACTIVE or if we are inactivating the only active formula
        await this.calculateProductProductionCost(formula.productId, companyId);

        return this.getFormulaWithDetails(formula.id, companyId);
    }

    async addLine(formulaId: string, companyId: string, dto: CreateFormulaLineDto) {
        const formula = await this.prisma.billOfMaterials.findFirst({
            where: { id: formulaId, companyId }
        });

        if (!formula) throw new NotFoundException('Formula not found');

        // Verify component exists and belongs to same company
        const component = await this.prisma.product.findUnique({
            where: { id: dto.componentProductId, companyId }
        });

        if (!component) throw new ForbiddenException('Component product not found or invalid');
        
        if (component.articleType === ArticleType.SERVICE) {
            throw new ForbiddenException('Service articles cannot be used as components');
        }

        if (component.id === formula.productId) {
            throw new ForbiddenException('A product cannot be a component of its own formula');
        }

        await this.prisma.bOMComponent.create({
            data: {
                quantity: dto.quantity,
                unit: dto.unit,
                wastagePercent: dto.wastagePercent,
                sortOrder: dto.sortOrder,
                note: dto.note,
                bom: { connect: { id: formula.id } },
                component: { connect: { id: dto.componentProductId } }
            }
        });
        
        return this.getFormulaWithDetails(formula.id, companyId);
    }

    async updateLine(lineId: string, companyId: string, dto: UpdateFormulaLineDto) {
        const line = await this.prisma.bOMComponent.findUnique({
            where: { id: lineId },
            include: { bom: true }
        });

        if (!line || line.bom.companyId !== companyId) {
            throw new NotFoundException('Formula line not found');
        }

        await this.prisma.bOMComponent.update({
            where: { id: lineId },
            data: dto
        });
        
        return this.getFormulaWithDetails(line.bomId, companyId);
    }

    async removeLine(lineId: string, companyId: string) {
        const line = await this.prisma.bOMComponent.findUnique({
            where: { id: lineId },
            include: { bom: true }
        });

        if (!line || line.bom.companyId !== companyId) {
            throw new NotFoundException('Formula line not found');
        }

        await this.prisma.bOMComponent.delete({
            where: { id: lineId }
        });
        
        return this.getFormulaWithDetails(line.bomId, companyId);
    }
}
