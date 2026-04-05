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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
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
    async findOne(id, companyId) {
        const product = await this.prisma.product.findFirst({
            where: { id, companyId },
            include: { family: true },
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
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
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
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.product.delete({
            where: { id },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map