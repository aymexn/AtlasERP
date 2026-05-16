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
exports.UomService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UomService = class UomService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        return this.prisma.unitOfMeasure.findMany({
            where: { companyId, isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id, companyId) {
        const uom = await this.prisma.unitOfMeasure.findFirst({
            where: { id, companyId },
        });
        if (!uom)
            throw new common_1.NotFoundException('Unit of measure not found');
        return uom;
    }
    async create(companyId, data) {
        return this.prisma.unitOfMeasure.create({
            data: {
                ...data,
                companyId,
            },
        });
    }
    async update(id, companyId, data) {
        return this.prisma.unitOfMeasure.updateMany({
            where: { id, companyId },
            data,
        });
    }
    async getProductUoms(productId) {
        return this.prisma.productUom.findMany({
            where: { productId },
            include: { uom: true },
        });
    }
    async addProductUom(productId, data) {
        return this.prisma.productUom.create({
            data: {
                ...data,
                productId,
            },
        });
    }
    async removeProductUom(id) {
        return this.prisma.productUom.delete({
            where: { id },
        });
    }
    async convert(quantity, fromUomId, toUomId, productId) {
        if (fromUomId === toUomId)
            return quantity;
        const productUoms = await this.prisma.productUom.findMany({
            where: { productId, uomId: { in: [fromUomId, toUomId] } },
        });
        const fromUom = productUoms.find(pu => pu.uomId === fromUomId);
        const toUom = productUoms.find(pu => pu.uomId === toUomId);
        if (!fromUom || !toUom) {
            console.warn(`[UomService] Missing UoM conversion for product ${productId}. Returning raw quantity.`);
            return quantity;
        }
        const qtyInStock = Number(quantity) * Number(fromUom.conversionFactor);
        return qtyInStock / Number(toUom.conversionFactor);
    }
};
exports.UomService = UomService;
exports.UomService = UomService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UomService);
//# sourceMappingURL=uom.service.js.map