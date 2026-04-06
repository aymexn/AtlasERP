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
exports.StockReceptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StockReceptionsService = class StockReceptionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
        return this.prisma.stockReception.findMany({
            where: { companyId },
            include: {
                purchaseOrder: { select: { reference: true, supplier: { select: { name: true } } } },
                warehouse: { select: { name: true } },
                _count: { select: { lines: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id, companyId) {
        const reception = await this.prisma.stockReception.findFirst({
            where: { id, companyId },
            include: {
                purchaseOrder: { include: { supplier: true } },
                warehouse: true,
                lines: { include: { product: true } }
            }
        });
        if (!reception) {
            throw new common_1.NotFoundException(`Réception introuvable.`);
        }
        return reception;
    }
    async validate(id, companyId) {
        const reception = await this.prisma.stockReception.findFirst({
            where: { id, companyId },
            include: { lines: true, purchaseOrder: { include: { lines: true } } }
        });
        if (!reception)
            throw new common_1.NotFoundException('Réception introuvable.');
        if (reception.status === 'VALIDATED')
            throw new common_1.BadRequestException('Cette réception est déjà validée.');
        for (const line of reception.lines) {
            if (Number(line.receivedQty) <= 0) {
                throw new common_1.BadRequestException(`La quantité reçue pour le produit ID ${line.productId} doit être supérieure à zéro.`);
            }
        }
        return this.prisma.$transaction(async (tx) => {
            for (const line of reception.lines) {
                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: line.productId,
                        warehouseToId: reception.warehouseId,
                        type: client_1.MovementType.IN,
                        quantity: line.receivedQty,
                        unit: line.unit,
                        unitCost: line.unitCost,
                        totalCost: Number(line.receivedQty) * Number(line.unitCost),
                        reference: `REC-${reception.reference}`,
                        reason: `Réception BC ${reception.purchaseOrder.reference}`,
                        date: new Date()
                    }
                });
                const productStock = await tx.productStock.findFirst({
                    where: { productId: line.productId, warehouseId: reception.warehouseId, companyId }
                });
                if (productStock) {
                    await tx.productStock.update({
                        where: { id: productStock.id },
                        data: { quantity: { increment: line.receivedQty } }
                    });
                }
                else {
                    await tx.productStock.create({
                        data: {
                            companyId,
                            productId: line.productId,
                            warehouseId: reception.warehouseId,
                            quantity: line.receivedQty
                        }
                    });
                }
                await tx.product.update({
                    where: { id: line.productId },
                    data: {
                        stockQuantity: { increment: line.receivedQty },
                        purchasePriceHt: line.unitCost
                    }
                });
                if (line.purchaseLineId) {
                    await tx.purchaseOrderLine.update({
                        where: { id: line.purchaseLineId },
                        data: { receivedQty: { increment: line.receivedQty } }
                    });
                }
                if (Number(line.receivedQty) > Number(line.expectedQty)) {
                }
            }
            const updatedOrderLines = await tx.purchaseOrderLine.findMany({
                where: { purchaseOrderId: reception.purchaseOrderId }
            });
            let allReceived = true;
            let anyReceived = false;
            for (const ol of updatedOrderLines) {
                if (Number(ol.receivedQty) < Number(ol.quantity)) {
                    allReceived = false;
                }
                if (Number(ol.receivedQty) > 0) {
                    anyReceived = true;
                }
            }
            const newStatus = allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIALLY_RECEIVED' : 'CONFIRMED');
            await tx.purchaseOrder.update({
                where: { id: reception.purchaseOrderId },
                data: { status: newStatus }
            });
            return tx.stockReception.update({
                where: { id },
                data: { status: 'VALIDATED' }
            });
        });
    }
};
exports.StockReceptionsService = StockReceptionsService;
exports.StockReceptionsService = StockReceptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockReceptionsService);
//# sourceMappingURL=stock-receptions.service.js.map