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
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../../notifications/notifications.service");
let StockMovementService = class StockMovementService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createMovement(companyId, userId, dto, tx) {
        const prisma = tx || this.prisma;
        const product = await prisma.product.findUnique({
            where: { id: dto.productId, companyId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Produit introuvable : ${dto.productId}`);
        }
        const reference = dto.reference || await this.generateReference(companyId, tx);
        const unitCost = dto.unitCost ?? Number(product.standardCost);
        const totalCost = Number(dto.quantity) * unitCost;
        const executeWork = async (client) => {
            if (dto.type === create_movement_dto_1.MovementType.IN || dto.type === 'MFG_OUTPUT') {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for IN/MFG_OUTPUT');
                await this.updateStock(client, companyId, dto.productId, dto.warehouseId, dto.quantity);
                await client.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { increment: dto.quantity } }
                });
            }
            else if (dto.type === create_movement_dto_1.MovementType.OUT || dto.type === 'MFG_CONSUMPTION') {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for OUT/MFG_CONSUMPTION');
                await this.updateStock(client, companyId, dto.productId, dto.warehouseId, -dto.quantity);
                const updatedProduct = await client.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { decrement: dto.quantity } }
                });
                if (updatedProduct.stockQuantity <= (updatedProduct.minStock || 0)) {
                    this.notificationService.notifyLowStock(updatedProduct, 'purchasing@atlas-erp.com').catch(console.error);
                }
            }
            else if (dto.type === create_movement_dto_1.MovementType.TRANSFER) {
                if (!dto.warehouseFromId || !dto.warehouseToId) {
                    throw new common_1.BadRequestException('Source and Destination warehouses are required for TRANSFER');
                }
                await this.updateStock(client, companyId, dto.productId, dto.warehouseFromId, -dto.quantity);
                await this.updateStock(client, companyId, dto.productId, dto.warehouseToId, dto.quantity);
            }
            else if (dto.type === create_movement_dto_1.MovementType.ADJUSTMENT) {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for ADJUSTMENT');
                const currentStock = await client.productStock.findUnique({
                    where: { productId_warehouseId_companyId: { productId: dto.productId, warehouseId: dto.warehouseId, companyId } }
                });
                const oldQty = currentStock ? Number(currentStock.quantity) : 0;
                const diff = Number(dto.quantity) - oldQty;
                await this.updateStock(client, companyId, dto.productId, dto.warehouseId, diff);
                await client.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { increment: diff } }
                });
            }
            const movement = await client.stockMovement.create({
                data: {
                    reference,
                    productId: dto.productId,
                    movementType: dto.type,
                    type: dto.type,
                    quantity: dto.quantity,
                    unit: dto.unit || product.unit,
                    unitCost: unitCost,
                    totalCost: totalCost,
                    warehouseFromId: dto.warehouseFromId || [create_movement_dto_1.MovementType.OUT, create_movement_dto_1.MovementType.ADJUSTMENT, 'MFG_CONSUMPTION'].includes(dto.type) ? dto.warehouseId : null,
                    warehouseToId: dto.warehouseToId || [create_movement_dto_1.MovementType.IN, 'MFG_OUTPUT'].includes(dto.type) ? dto.warehouseId : null,
                    reason: dto.reason,
                    date: dto.date ? new Date(dto.date) : new Date(),
                    companyId: companyId,
                    createdBy: userId,
                },
            });
            const updatedProduct = await client.product.findUnique({ where: { id: dto.productId } });
            if (updatedProduct) {
                await client.product.update({
                    where: { id: dto.productId },
                    data: {
                        stockValue: Number(updatedProduct.stockQuantity) * Number(updatedProduct.standardCost),
                    },
                });
            }
            return movement;
        };
        if (tx) {
            return executeWork(tx);
        }
        else {
            return this.prisma.$transaction(async (newTx) => executeWork(newTx));
        }
    }
    async validateReception(companyId, userId, receptionId, tx) {
        const prisma = tx || this.prisma;
        const reception = await prisma.stockReception.findFirst({
            where: { id: receptionId, companyId },
            include: { lines: true, purchaseOrder: true }
        });
        if (!reception)
            throw new common_1.NotFoundException('Réception introuvable');
        if (reception.status === 'VALIDATED')
            throw new common_1.BadRequestException('Déjà validé');
        const executeWork = async (client) => {
            for (const line of reception.lines) {
                await this.createMovement(companyId, userId, {
                    productId: line.productId,
                    quantity: Number(line.receivedQty),
                    type: create_movement_dto_1.MovementType.IN,
                    warehouseId: reception.warehouseId,
                    reference: `REC-${reception.reference}`,
                    reason: `Réception BC ${reception.purchaseOrder.reference}`,
                    unitCost: Number(line.unitCost),
                    unit: line.unit
                }, client);
            }
            await client.stockReception.update({
                where: { id: receptionId },
                data: { status: 'VALIDATED' }
            });
        };
        if (tx) {
            return executeWork(tx);
        }
        else {
            return this.prisma.$transaction(async (newTx) => executeWork(newTx));
        }
    }
    async completeSalesOrder(companyId, userId, orderId, warehouseId) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id: orderId, companyId },
            include: { lines: { include: { product: true } } }
        });
        if (!order)
            throw new common_1.NotFoundException('Vente introuvable');
        return this.prisma.$transaction(async (tx) => {
            for (const line of order.lines) {
                await this.createMovement(companyId, userId, {
                    productId: line.productId,
                    quantity: Number(line.quantity),
                    type: create_movement_dto_1.MovementType.OUT,
                    warehouseId: warehouseId,
                    reference: `SO-${order.reference}`,
                    reason: `Vente Client ${order.reference}`,
                    unitCost: Number(line.product.standardCost),
                    unit: line.unit
                }, tx);
            }
            await tx.salesOrder.update({
                where: { id: orderId },
                data: { status: 'SHIPPED' }
            });
        });
    }
    async completeManufacturingOrder(companyId, userId, moId, warehouseId) {
        const mo = await this.prisma.manufacturingOrder.findFirst({
            where: { id: moId, companyId },
            include: {
                product: true,
                lines: { include: { component: true } }
            }
        });
        if (!mo)
            throw new common_1.NotFoundException('OF introuvable');
        if (mo.status === 'COMPLETED')
            throw new common_1.BadRequestException('Déjà terminé');
        return this.prisma.$transaction(async (tx) => {
            let totalCost = new client_1.Prisma.Decimal(0);
            const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } });
            for (const line of mo.lines) {
                const stock = await tx.productStock.findUnique({
                    where: {
                        productId_warehouseId_companyId: {
                            productId: line.componentProductId,
                            warehouseId: warehouseId,
                            companyId: companyId
                        }
                    }
                });
                const required = Number(line.requiredQuantity);
                const available = Number(stock?.quantity || 0);
                if (available < required) {
                    throw new common_1.BadRequestException(`Stock insuffisant pour [${line.component.name}] dans l'entrepôt [${warehouse?.name || 'Inconnu'}]. ` +
                        `Requis: ${required.toLocaleString()}, Disponible: ${available.toLocaleString()}.`);
                }
            }
            for (const line of mo.lines) {
                const qty = Number(line.requiredQuantity);
                const unitCost = Number(line.component.standardCost || line.component.purchasePriceHt || 0);
                await this.createMovement(companyId, userId, {
                    productId: line.componentProductId,
                    quantity: qty,
                    type: 'MFG_CONSUMPTION',
                    warehouseId: warehouseId,
                    reference: `MO-CONS-${mo.reference}`,
                    reason: `Consommation pour OF ${mo.reference}`,
                    unitCost: unitCost,
                    unit: line.unit
                }, tx);
                totalCost = totalCost.add(qty * unitCost);
            }
            const producedQty = Number(mo.plannedQuantity);
            const actualUnitCost = producedQty > 0 ? totalCost.dividedBy(producedQty).toNumber() : 0;
            await this.createMovement(companyId, userId, {
                productId: mo.productId,
                quantity: producedQty,
                type: 'MFG_OUTPUT',
                warehouseId: warehouseId,
                reference: `MO-PROD-${mo.reference}`,
                reason: `Production Output OF ${mo.reference}`,
                unitCost: actualUnitCost,
                unit: mo.unit
            }, tx);
            await tx.manufacturingOrder.update({
                where: { id: moId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    producedQuantity: producedQty,
                    totalActualCost: totalCost
                }
            });
            await tx.product.update({
                where: { id: mo.productId },
                data: { standardCost: actualUnitCost }
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    companyId,
                    action: 'MANUFACTURING_ORDER_CLOSED',
                    entity: 'ManufacturingOrder',
                    entityId: mo.id,
                    description: `Production finalisée: ${producedQty} de ${mo.product.name} (Réf: ${mo.reference}). Coût unitaire: ${actualUnitCost.toFixed(2)}.`
                }
            });
            return mo;
        });
    }
    async updateStock(tx, companyId, productId, warehouseId, delta) {
        const stock = await tx.productStock.findUnique({
            where: { productId_warehouseId_companyId: { productId, warehouseId, companyId } }
        });
        const newQty = (stock ? Number(stock.quantity) : 0) + delta;
        const company = await tx.company.findUnique({ where: { id: companyId }, select: { allowNegativeStock: true } });
        if (!company?.allowNegativeStock && newQty < 0) {
            const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true } });
            const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } });
            throw new common_1.BadRequestException(`Stock insuffisant pour [${product?.name || 'Produit inconnu'}] dans l'entrepôt [${warehouse?.name || 'Entrepôt sélectionné'}]. ` +
                `Requis: ${Math.abs(delta)}, Disponible: ${stock ? stock.quantity : 0}`);
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
    async generateReference(companyId, tx) {
        const client = tx || this.prisma;
        const count = await client.stockMovement.count({
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationService])
], StockMovementService);
//# sourceMappingURL=stock-movement.service.js.map