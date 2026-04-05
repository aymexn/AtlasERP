import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async list(companyId: string) {
        return this.prisma.product.findMany({
            where: { companyId },
            include: { 
                family: true,
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
            include: { family: true },
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

        const { salePriceHt, standardCost, stockQuantity, taxRate, trackStock, familyId, ...rest } = dto;

        return this.prisma.product.create({
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
    }

    async update(id: string, dto: UpdateProductDto, companyId: string) {
        // Ensure product exists and belongs to company
        await this.findOne(id, companyId);

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

        const { salePriceHt, standardCost, stockQuantity, taxRate, trackStock, familyId, ...rest } = dto;

        return this.prisma.product.update({
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
    }

    async remove(id: string, companyId: string) {
        // Ensure product exists and belongs to company
        await this.findOne(id, companyId);

        return this.prisma.product.delete({
            where: { id },
        });
    }
}
