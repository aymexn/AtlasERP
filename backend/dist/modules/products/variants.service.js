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
exports.VariantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VariantsService = class VariantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(productId) {
        return this.prisma.productVariant.findMany({
            where: { productId },
            orderBy: { sku: 'asc' },
        });
    }
    async create(productId, data) {
        return this.prisma.productVariant.create({
            data: {
                ...data,
                productId,
            },
        });
    }
    async update(id, data) {
        return this.prisma.productVariant.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        return this.prisma.productVariant.delete({
            where: { id },
        });
    }
    async generateMatrix(productId, attributes) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const keys = Object.keys(attributes);
        const combinations = [];
        const helper = (index, current) => {
            if (index === keys.length) {
                combinations.push({ ...current });
                return;
            }
            const key = keys[index];
            for (const value of attributes[key]) {
                current[key] = value;
                helper(index + 1, current);
            }
        };
        helper(0, {});
        const variants = [];
        for (const combo of combinations) {
            const nameSuffix = Object.values(combo).join(' ');
            const skuSuffix = Object.values(combo).map(v => v.substring(0, 3).toUpperCase()).join('-');
            const variant = await this.prisma.productVariant.create({
                data: {
                    productId,
                    sku: `${product.sku}-${skuSuffix}`,
                    name: `${product.name} (${nameSuffix})`,
                    attributeValues: combo,
                    isActive: true,
                },
            });
            variants.push(variant);
        }
        return variants;
    }
};
exports.VariantsService = VariantsService;
exports.VariantsService = VariantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VariantsService);
//# sourceMappingURL=variants.service.js.map