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
exports.StockMovementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const create_movement_dto_1 = require("../dto/create-movement.dto");
let StockMovementService = class StockMovementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createMovement(companyId, userId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId, companyId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const reference = dto.reference || await this.generateReference(companyId);
        const unitCost = dto.unitCost ?? Number(product.standardCost);
        const totalCost = dto.quantity * unitCost;
        return this.prisma.$transaction(async (tx) => {
            if (dto.type === create_movement_dto_1.MovementType.IN) {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for IN movement');
                await this.updateStock(tx, companyId, dto.productId, dto.warehouseId, dto.quantity);
                await tx.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { increment: dto.quantity } }
                });
            }
            else if (dto.type === create_movement_dto_1.MovementType.OUT) {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for OUT movement');
                await this.updateStock(tx, companyId, dto.productId, dto.warehouseId, -dto.quantity);
                await tx.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { decrement: dto.quantity } }
                });
            }
            else if (dto.type === create_movement_dto_1.MovementType.TRANSFER) {
                if (!dto.warehouseFromId || !dto.warehouseToId) {
                    throw new common_1.BadRequestException('Source and Destination warehouses are required for TRANSFER');
                }
                await this.updateStock(tx, companyId, dto.productId, dto.warehouseFromId, -dto.quantity);
                await this.updateStock(tx, companyId, dto.productId, dto.warehouseToId, dto.quantity);
            }
            else if (dto.type === create_movement_dto_1.MovementType.ADJUSTMENT) {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for ADJUSTMENT');
                const currentStock = await tx.productStock.findUnique({
                    where: { productId_warehouseId_companyId: { productId: dto.productId, warehouseId: dto.warehouseId, companyId } }
                });
                const oldQty = currentStock ? Number(currentStock.quantity) : 0;
                const diff = dto.quantity - oldQty;
                await this.updateStock(tx, companyId, dto.productId, dto.warehouseId, diff);
                await tx.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { increment: diff } }
                });
            }
            const movement = await tx.stockMovement.create({
                data: {
                    reference,
                    productId: dto.productId,
                    type: dto.type,
                    quantity: dto.quantity,
                    unit: dto.unit,
                    unitCost: unitCost,
                    totalCost: totalCost,
                    warehouseFromId: dto.warehouseFromId || (dto.type === create_movement_dto_1.MovementType.OUT || dto.type === create_movement_dto_1.MovementType.ADJUSTMENT ? dto.warehouseId : null),
                    warehouseToId: dto.warehouseToId || (dto.type === create_movement_dto_1.MovementType.IN ? dto.warehouseId : null),
                    reason: dto.reason,
                    date: dto.date ? new Date(dto.date) : undefined,
                    companyId: companyId,
                    createdBy: userId,
                },
            });
            const updatedProduct = await tx.product.findUnique({ where: { id: dto.productId } });
            if (updatedProduct) {
                await tx.product.update({
                    where: { id: dto.productId },
                    data: {
                        stockValue: Number(updatedProduct.stockQuantity) * Number(updatedProduct.standardCost),
                    },
                });
            }
            return movement;
        });
    }
    async updateStock(tx, companyId, productId, warehouseId, delta) {
        const stock = await tx.productStock.findUnique({
            where: { productId_warehouseId_companyId: { productId, warehouseId, companyId } }
        });
        const newQty = (stock ? Number(stock.quantity) : 0) + delta;
        if (newQty < 0) {
            throw new common_1.BadRequestException('Stock insuffisant');
        }
        if (stock) {
            await tx.productStock.update({
                where: { id: stock.id },
                data: { quantity: newQty }
            });
        }
        else {
            await tx.productStock.create({
                data: {
                    productId,
                    warehouseId,
                    companyId,
                    quantity: newQty
                }
            });
        }
    }
    async generateReference(companyId) {
        const count = await this.prisma.stockMovement.count({
            where: { companyId }
        });
        const nextNumber = count + 1;
        return `MVMT-${nextNumber.toString().padStart(4, '0')}`;
    }
    async getProductMovementHistory(productId, companyId) {
        return this.prisma.stockMovement.findMany({
            where: { productId, companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true } },
                warehouseFrom: { select: { name: true } },
                warehouseTo: { select: { name: true } },
            },
        });
    }
    async listMovements(companyId) {
        return this.prisma.stockMovement.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { name: true, sku: true } },
                user: { select: { email: true } },
                warehouseFrom: { select: { name: true } },
                warehouseTo: { select: { name: true } },
            },
        });
    }
};
exports.StockMovementService = StockMovementService;
exports.StockMovementService = StockMovementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockMovementService);
//# sourceMappingURL=stock-movement.service.js.map