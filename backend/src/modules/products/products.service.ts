import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { FormulaService } from './formula.service';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => FormulaService))
        private formulaService: FormulaService
    ) { }

    async list(companyId: string) {
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

    async findOne(id: string, companyId: string) {
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
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async create(companyId: string, dto: CreateProductDto) {
        // Check if SKU already exists in this company
        const existing = await this.prisma.product.findUnique({
            where: {
                companyId_sku: {
                    companyId,
                    sku: dto.sku,
                },
            },
        });

        if (existing) {
            throw new ConflictException(`SKU "${dto.sku}" already exists in your inventory`);
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

            // If formula lines are provided, create default formula
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
                        unit: 'pcs', // Default
                        wastagePercent: 0,
                        sortOrder: 0
                    }))
                }, tx);
            }

            return product;
        });
    }

    async update(id: string, dto: UpdateProductDto, companyId: string) {
        // Ensure product exists and belongs to company
        const product = await this.findOne(id, companyId);

        // If SKU is changing, check uniqueness
        if (dto.sku) {
            const existing = await this.prisma.product.findFirst({
                where: {
                    companyId,
                    sku: dto.sku,
                    NOT: { id },
                },
            });

            if (existing) {
                throw new ConflictException(`SKU "${dto.sku}" already exists in your inventory`);
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

            // Handle Formula Update if lines provided
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
                } else if (formulaLines.length > 0) {
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

    async remove(id: string, companyId: string) {
        // Ensure product exists and belongs to company
        await this.findOne(id, companyId);

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async recalculateCost(id: string, companyId: string) {
        // Just a wrapper to call formula service (using any to bypass private visibility or I could make the service method public)
        return (this.formulaService as any).calculateProductProductionCost(id, companyId);
    }
}
