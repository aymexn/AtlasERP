"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FormulaService = class FormulaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFormulaWithDetails(id, companyId) {
        const whereClause = { id };
        if (companyId)
            whereClause.companyId = companyId;
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
        if (!formula)
            return null;
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
    async getProductFormulas(productId, companyId) {
        const formulas = await this.prisma.productFormula.findMany({
            where: { productId, companyId },
            orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
        });
        const details = await Promise.all(formulas.map(f => this.getFormulaWithDetails(f.id, companyId)));
        return details.filter(f => f !== null);
    }
    async getFormula(id, companyId) {
        return this.getFormulaWithDetails(id, companyId);
    }
    async createFormula(productId, companyId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId, companyId }
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (product.articleType !== client_1.ArticleType.FINISHED_PRODUCT && product.articleType !== client_1.ArticleType.SEMI_FINISHED) {
            throw new common_1.ForbiddenException('Only finished or semi-finished products can have formulas');
        }
        const { lines, ...formulaData } = dto;
        if (lines && lines.length > 0) {
            const hasSelf = lines.some(l => l.componentProductId === productId);
            if (hasSelf)
                throw new common_1.ForbiddenException('A product cannot be a component of its own formula');
            const componentIds = lines.map(l => l.componentProductId);
            const components = await this.prisma.product.findMany({
                where: { id: { in: componentIds }, companyId }
            });
            const hasRestricted = components.some(c => c.articleType === client_1.ArticleType.SERVICE);
            if (hasRestricted)
                throw new common_1.ForbiddenException('Service articles cannot be components');
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
                status: formulaData.status,
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
    async updateFormula(formulaId, companyId, dto) {
        const formula = await this.prisma.productFormula.findFirst({
            where: { id: formulaId, companyId }
        });
        if (!formula)
            throw new common_1.NotFoundException('Formula not found');
        const { lines, ...formulaData } = dto;
        return this.prisma.$transaction(async (tx) => {
            await tx.productFormula.update({
                where: { id: formula.id },
                data: {
                    ...formulaData,
                    status: formulaData.status
                }
            });
            if (lines !== undefined) {
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
    async updateFormulaStatus(formulaId, companyId, status) {
        const formula = await this.prisma.productFormula.findFirst({
            where: { id: formulaId, companyId }
        });
        if (!formula)
            throw new common_1.NotFoundException('Formula not found');
        if (status === 'ACTIVE') {
            await this.prisma.productFormula.updateMany({
                where: { productId: formula.productId, companyId, id: { not: formula.id } },
                data: { status: 'ARCHIVED', isActive: false }
            });
        }
        await this.prisma.productFormula.update({
            where: { id: formula.id },
            data: { status: status, isActive: status === 'ACTIVE' }
        });
        return this.getFormulaWithDetails(formula.id, companyId);
    }
    async addLine(formulaId, companyId, dto) {
        const formula = await this.prisma.productFormula.findFirst({
            where: { id: formulaId, companyId }
        });
        if (!formula)
            throw new common_1.NotFoundException('Formula not found');
        const component = await this.prisma.product.findUnique({
            where: { id: dto.componentProductId, companyId }
        });
        if (!component)
            throw new common_1.ForbiddenException('Component product not found or invalid');
        if (component.articleType === client_1.ArticleType.SERVICE) {
            throw new common_1.ForbiddenException('Service articles cannot be used as components');
        }
        if (component.id === formula.productId) {
            throw new common_1.ForbiddenException('A product cannot be a component of its own formula');
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
    async updateLine(lineId, companyId, dto) {
        const line = await this.prisma.productFormulaLine.findUnique({
            where: { id: lineId },
            include: { formula: true }
        });
        if (!line || line.formula.companyId !== companyId) {
            throw new common_1.NotFoundException('Formula line not found');
        }
        await this.prisma.productFormulaLine.update({
            where: { id: lineId },
            data: dto
        });
        return this.getFormulaWithDetails(line.formulaId, companyId);
    }
    async removeLine(lineId, companyId) {
        const line = await this.prisma.productFormulaLine.findUnique({
            where: { id: lineId },
            include: { formula: true }
        });
        if (!line || line.formula.companyId !== companyId) {
            throw new common_1.NotFoundException('Formula line not found');
        }
        await this.prisma.productFormulaLine.delete({
            where: { id: lineId }
        });
        return this.getFormulaWithDetails(line.formulaId, companyId);
    }
};
exports.FormulaService = FormulaService;
exports.FormulaService = FormulaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FormulaService);
//# sourceMappingURL=formula.service.js.map