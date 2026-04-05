import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
import { ArticleType } from '@prisma/client';

@Injectable()
export class FormulaService {
    constructor(private prisma: PrismaService) { }

    private async getFormulaWithDetails(id: string, companyId?: string) {
        const whereClause: any = { id };
        if (companyId) whereClause.companyId = companyId;

        const formula = await this.prisma.productFormula.findFirst({
            where: whereClause,
            include: {
                lines: {
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

        const enrichedLines = formula.lines.map(line => {
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
            lines: enrichedLines,
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
        const formulas = await this.prisma.productFormula.findMany({
            where: { productId, companyId },
            orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
        });
        
        const details = await Promise.all(formulas.map(f => this.getFormulaWithDetails(f.id, companyId)));
        return details.filter(f => f !== null);
    }

    async getFormula(id: string, companyId: string) {
        return this.getFormulaWithDetails(id, companyId);
    }

    async createFormula(productId: string, companyId: string, dto: CreateFormulaDto) {
        // Verify product belongs to company and is of right type
        const product = await this.prisma.product.findUnique({
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

        const createdFormula = await this.prisma.productFormula.create({
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
                
                lines: lines ? {
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
        
        return this.getFormulaWithDetails(createdFormula.id, companyId);
    }

    async updateFormula(formulaId: string, companyId: string, dto: UpdateFormulaDto) {
        const formula = await this.prisma.productFormula.findFirst({
            where: { id: formulaId, companyId }
        });

        if (!formula) throw new NotFoundException('Formula not found');

        const { lines, ...formulaData } = dto;

        return this.prisma.$transaction(async (tx) => {
            await tx.productFormula.update({
                where: { id: formula.id },
                data: {
                    ...formulaData,
                    status: formulaData.status as any
                }
            });

            if (lines !== undefined) {
                // BOM Synchronization logic: Clear and Recreate
                // This ensures correct sort order and clean state for the formula version
                await tx.productFormulaLine.deleteMany({
                    where: { formulaId: formula.id }
                });

                if (lines.length > 0) {
                    await tx.productFormulaLine.createMany({
                        data: lines.map(line => ({
                            formulaId: formula.id,
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

            return this.getFormulaWithDetails(formula.id, companyId);
        });
    }

    async updateFormulaStatus(formulaId: string, companyId: string, status: string) {
        const formula = await this.prisma.productFormula.findFirst({
            where: { id: formulaId, companyId }
        });

        if (!formula) throw new NotFoundException('Formula not found');

        if (status === 'ACTIVE') {
            await this.prisma.productFormula.updateMany({
                where: { productId: formula.productId, companyId, id: { not: formula.id } },
                data: { status: 'ARCHIVED', isActive: false }
            });
        }

        await this.prisma.productFormula.update({
            where: { id: formula.id },
            data: { status: status as any, isActive: status === 'ACTIVE' }
        });

        return this.getFormulaWithDetails(formula.id, companyId);
    }

    async addLine(formulaId: string, companyId: string, dto: CreateFormulaLineDto) {
        const formula = await this.prisma.productFormula.findFirst({
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

        await this.prisma.productFormulaLine.create({
            data: {
                quantity: dto.quantity,
                unit: dto.unit,
                wastagePercent: dto.wastagePercent,
                sortOrder: dto.sortOrder,
                note: dto.note,
                formula: { connect: { id: formula.id } },
                component: { connect: { id: dto.componentProductId } }
            }
        });
        
        return this.getFormulaWithDetails(formula.id, companyId);
    }

    async updateLine(lineId: string, companyId: string, dto: UpdateFormulaLineDto) {
        const line = await this.prisma.productFormulaLine.findUnique({
            where: { id: lineId },
            include: { formula: true }
        });

        if (!line || line.formula.companyId !== companyId) {
            throw new NotFoundException('Formula line not found');
        }

        await this.prisma.productFormulaLine.update({
            where: { id: lineId },
            data: dto
        });
        
        return this.getFormulaWithDetails(line.formulaId, companyId);
    }

    async removeLine(lineId: string, companyId: string) {
        const line = await this.prisma.productFormulaLine.findUnique({
            where: { id: lineId },
            include: { formula: true }
        });

        if (!line || line.formula.companyId !== companyId) {
            throw new NotFoundException('Formula line not found');
        }

        await this.prisma.productFormulaLine.delete({
            where: { id: lineId }
        });
        
        return this.getFormulaWithDetails(line.formulaId, companyId);
    }
}
