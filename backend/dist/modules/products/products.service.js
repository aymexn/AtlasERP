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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const formula_service_1 = require("./formula.service");
let ProductsService = class ProductsService {
    constructor(prisma, formulaService) {
        this.prisma = prisma;
        this.formulaService = formulaService;
    }
    async list(companyId) {
        return this.prisma.product.findMany({
            where: { companyId },
            include: {
                family: true,
                bomsAsFinishedProduct: {
                    where: { isActive: true },
                    include: { components: true }
                },
                stockMovements: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, companyId) {
        const product = await this.prisma.product.findFirst({
            where: { id, companyId },
            include: {
                family: true,
                bomsAsFinishedProduct: {
                    where: { isActive: true },
                    include: { components: true }
                }
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async create(companyId, dto) {
        const existing = await this.prisma.product.findUnique({
            where: {
                companyId_sku: {
                    companyId,
                    sku: dto.sku,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`SKU "${dto.sku}" already exists in your inventory`);
        }
        const { salePriceHt, standardCost, stockQuantity, taxRate, trackStock, familyId, formulaLines, ...rest } = dto;
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    ...rest,
                    familyId: familyId || null,
                    salePriceHt: salePriceHt,
                    standardCost: standardCost,
                    stockQuantity: stockQuantity || 0,
                    taxRate: taxRate || 0.20,
                    trackStock: trackStock ?? true,
                    companyId,
                },
                include: { family: true },
            });
            if (formulaLines && formulaLines.length > 0) {
                await this.formulaService.createFormula(product.id, companyId, {
                    name: `Formule Standard ${product.name}`,
                    isActive: true,
                    status: 'ACTIVE',
                    outputQuantity: 1,
                    outputUnit: product.unit || 'pcs',
                    lines: formulaLines.map(l => ({
                        componentProductId: l.componentId,
                        quantity: l.quantity,
                        unit: 'pcs',
                        wastagePercent: 0,
                        sortOrder: 0
                    }))
                }, tx);
            }
            return product;
        });
    }
    async update(id, dto, companyId) {
        const product = await this.findOne(id, companyId);
        if (dto.sku) {
            const existing = await this.prisma.product.findFirst({
                where: {
                    companyId,
                    sku: dto.sku,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException(`SKU "${dto.sku}" already exists in your inventory`);
            }
        }
        const { salePriceHt, standardCost, stockQuantity, taxRate, trackStock, familyId, formulaLines, ...rest } = dto;
        return this.prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    ...rest,
                    ...(familyId !== undefined && { familyId: familyId || null }),
                    ...(salePriceHt !== undefined && { salePriceHt }),
                    ...(standardCost !== undefined && { standardCost }),
                    ...(stockQuantity !== undefined && { stockQuantity }),
                    ...(taxRate !== undefined && { taxRate }),
                    ...(trackStock !== undefined && { trackStock }),
                },
                include: { family: true },
            });
            if (formulaLines !== undefined) {
                const activeFormula = await tx.billOfMaterials.findFirst({
                    where: { productId: id, companyId, isActive: true }
                });
                if (activeFormula) {
                    await this.formulaService.updateFormula(activeFormula.id, companyId, {
                        lines: formulaLines.map(l => ({
                            componentProductId: l.componentId,
                            quantity: l.quantity,
                            unit: 'pcs',
                            wastagePercent: 0,
                            sortOrder: 0
                        }))
                    }, tx);
                }
                else if (formulaLines.length > 0) {
                    await this.formulaService.createFormula(id, companyId, {
                        name: `Formule Standard ${updatedProduct.name}`,
                        isActive: true,
                        status: 'ACTIVE',
                        outputQuantity: 1,
                        outputUnit: updatedProduct.unit || 'pcs',
                        lines: formulaLines.map(l => ({
                            componentProductId: l.componentId,
                            quantity: l.quantity,
                            unit: 'pcs',
                            wastagePercent: 0,
                            sortOrder: 0
                        }))
                    }, tx);
                }
            }
            return updatedProduct;
        });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.product.delete({
            where: { id },
        });
    }
    async recalculateCost(id, companyId) {
        return this.formulaService.calculateProductProductionCost(id, companyId);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => formula_service_1.FormulaService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        formula_service_1.FormulaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map