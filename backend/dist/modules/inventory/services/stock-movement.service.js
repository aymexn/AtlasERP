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
const uom_service_1 = require("../../products/uom.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let StockMovementService = class StockMovementService {
    constructor(prisma, notificationService, uomService, eventEmitter) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.uomService = uomService;
        this.eventEmitter = eventEmitter;
    }
    async createMovement(companyId, userId, dto, tx) {
        const prisma = tx || this.prisma;
        const product = await prisma.product.findFirst({
            where: { id: dto.productId, companyId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Produit introuvable : ${dto.productId}`);
        }
        let finalQuantity = Number(dto.quantity);
        if (dto.uomId && product.stockUomId && dto.uomId !== product.stockUomId) {
            finalQuantity = await this.uomService.convert(finalQuantity, dto.uomId, product.stockUomId, dto.productId);
        }
        const reference = dto.reference || await this.generateReference(companyId, tx);
        const unitCost = dto.unitCost ?? Number(product.standardCost);
        const totalCost = Number(finalQuantity) * unitCost;
        const executeWork = async (client) => {
            if (dto.type === create_movement_dto_1.MovementType.IN || dto.type === 'MFG_OUTPUT') {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for IN/MFG_OUTPUT');
                await this.updateStock(client, companyId, dto.productId, dto.warehouseId, finalQuantity, dto.variantId);
                await client.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { increment: finalQuantity } }
                });
            }
            else if (dto.type === create_movement_dto_1.MovementType.OUT || dto.type === 'MFG_CONSUMPTION') {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for OUT/MFG_CONSUMPTION');
                await this.updateStock(client, companyId, dto.productId, dto.warehouseId, -finalQuantity, dto.variantId);
                const updatedProduct = await client.product.update({
                    where: { id: dto.productId },
                    data: { stockQuantity: { decrement: finalQuantity } }
                });
                if (updatedProduct.stockQuantity <= (updatedProduct.minStock || 0)) {
                    this.notificationService.notifyLowStock(updatedProduct, 'purchasing@atlas-erp.com').catch(console.error);
                }
            }
            else if (dto.type === create_movement_dto_1.MovementType.TRANSFER) {
                if (!dto.warehouseFromId || !dto.warehouseToId) {
                    throw new common_1.BadRequestException('Source and Destination warehouses are required for TRANSFER');
                }
                await this.updateStock(client, companyId, dto.productId, dto.warehouseFromId, -finalQuantity, dto.variantId);
                await this.updateStock(client, companyId, dto.productId, dto.warehouseToId, finalQuantity, dto.variantId);
            }
            else if (dto.type === create_movement_dto_1.MovementType.ADJUSTMENT) {
                if (!dto.warehouseId)
                    throw new common_1.BadRequestException('Warehouse ID is required for ADJUSTMENT');
                const currentStock = await client.productStock.findFirst({
                    where: {
                        productId: dto.productId,
                        warehouseId: dto.warehouseId,
                        companyId,
                        variantId: dto.variantId || null
                    }
                });
                const oldQty = currentStock ? Number(currentStock.quantity) : 0;
                const diff = Number(finalQuantity) - oldQty;
                await this.updateStock(client, companyId, dto.productId, dto.warehouseId, diff, dto.variantId);
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
                    quantity: finalQuantity,
                    unit: dto.unit || product.unit,
                    unitCost: unitCost,
                    totalCost: totalCost,
                    warehouseFromId: dto.warehouseFromId || [create_movement_dto_1.MovementType.OUT, create_movement_dto_1.MovementType.ADJUSTMENT, 'MFG_CONSUMPTION'].includes(dto.type) ? dto.warehouseId : null,
                    warehouseToId: dto.warehouseToId || [create_movement_dto_1.MovementType.IN, 'MFG_OUTPUT'].includes(dto.type) ? dto.warehouseId : null,
                    reason: dto.reason,
                    date: dto.date ? new Date(dto.date) : new Date(),
                    companyId: companyId,
                    createdBy: userId,
                    variantId: dto.variantId,
                    uomId: dto.uomId
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
            const result = await this.prisma.$transaction(async (newTx) => executeWork(newTx));
            this.eventEmitter.emit('dashboard.refresh', { companyId });
            return result;
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
                    unit: line.unit,
                    variantId: line.variantId,
                    uomId: line.uomId
                }, client);
                await client.purchaseOrderLine.update({
                    where: { id: line.purchaseLineId },
                    data: {
                        receivedQty: { increment: Number(line.receivedQty) }
                    }
                });
            }
            console.log(`[StockMovementService] Marking reception ${receptionId} as VALIDATED`);
            await client.stockReception.update({
                where: { id: receptionId },
                data: {
                    status: 'VALIDATED',
                    validatedAt: new Date()
                }
            });
            const po = await client.purchaseOrder.findUnique({
                where: { id: reception.purchaseOrderId },
                include: { lines: true }
            });
            if (po) {
                const allReceived = po.lines.every(l => Number(l.receivedQty) >= Number(l.quantity));
                const anyReceived = po.lines.some(l => Number(l.receivedQty) > 0);
                let newStatus = po.status;
                if (allReceived) {
                    newStatus = client_1.PurchaseOrderStatus.FULLY_RECEIVED;
                }
                else if (anyReceived) {
                    newStatus = client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED;
                }
                if (newStatus !== po.status) {
                    await client.purchaseOrder.update({
                        where: { id: po.id },
                        data: { status: newStatus }
                    });
                }
            }
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
    async completeManufacturingOrder(companyId, userId, moId, warehouseId, producedQty) {
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
            const productIds = mo.lines.map(l => l.componentProductId);
            const stocks = await tx.productStock.groupBy({
                by: ['productId'],
                where: { companyId, productId: { in: productIds } },
                _sum: { quantity: true }
            });
            const reserved = await tx.manufacturingOrderLine.groupBy({
                by: ['componentProductId'],
                where: {
                    manufacturingOrder: {
                        companyId,
                        status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] }
                    },
                    NOT: { manufacturingOrderId: moId }
                },
                _sum: { requiredQuantity: true }
            });
            const physicalMap = new Map(stocks.map(s => [s.productId, Number(s._sum.quantity || 0)]));
            const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
            for (const line of mo.lines) {
                const required = Number(line.requiredQuantity);
                const available = Math.max(0, (physicalMap.get(line.componentProductId) || 0) - (resMap.get(line.componentProductId) || 0));
                if (available < required) {
                    throw new common_1.BadRequestException(`Stock total insuffisant pour [${line.component.name}]. ` +
                        `Requis: ${required.toLocaleString()}, Disponible: ${available.toLocaleString()}.`);
                }
            }
            for (const line of mo.lines) {
                const required = Number(line.requiredQuantity);
                const consumed = Number(line.consumedQuantity);
                const remainingToConsume = Math.max(0, required - consumed);
                const variantId = line.variantId;
                if (remainingToConsume <= 0)
                    continue;
                const unitCost = Number(line.component.standardCost || line.component.purchasePriceHt || 0);
                await this.deductStockFromAnyWarehouse(companyId, userId, line.componentProductId, remainingToConsume, `MO-CONS-${mo.reference}`, `Consommation pour OF ${mo.reference}`, unitCost, line.unit, tx, variantId, line.uomId);
                await tx.manufacturingOrderLine.update({
                    where: { id: line.id },
                    data: { consumedQuantity: { increment: remainingToConsume } }
                });
                totalCost = totalCost.add(required * unitCost);
            }
            const actualUnitCost = producedQty > 0 ? totalCost.dividedBy(producedQty).toNumber() : 0;
            await this.createMovement(companyId, userId, {
                productId: mo.productId,
                quantity: producedQty,
                type: 'MFG_OUTPUT',
                warehouseId: warehouseId,
                reference: `MO-PROD-${mo.reference}`,
                reason: `Production Output OF ${mo.reference}`,
                unitCost: actualUnitCost,
                unit: mo.unit,
                uomId: mo.uomId,
                variantId: mo.variantId
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
                    description: `Production finalisée: ${producedQty} ${mo.unit} de ${mo.product.name} (Réf: ${mo.reference}). Coût total: ${totalCost.toFixed(2)} DZD.`
                }
            });
            return mo;
        });
    }
    async deductStockFromAnyWarehouse(companyId, userId, productId, quantity, reference, reason, unitCost, unit, tx, variantId, uomId) {
        const stocks = await tx.productStock.findMany({
            where: {
                productId,
                companyId,
                quantity: { gt: 0 },
                variantId: variantId || null
            },
            orderBy: { quantity: 'desc' }
        });
        let remaining = quantity;
        for (const stock of stocks) {
            if (remaining <= 0)
                break;
            const deduct = Math.min(Number(stock.quantity), remaining);
            await this.createMovement(companyId, userId, {
                productId,
                quantity: deduct,
                type: 'MFG_CONSUMPTION',
                warehouseId: stock.warehouseId,
                reference,
                reason,
                unitCost,
                unit,
                variantId: variantId || null,
                uomId: uomId
            }, tx);
            remaining -= deduct;
        }
        if (remaining > 0.001) {
            throw new common_1.BadRequestException(`Stock insuffisant après tentative de déduction globale pour le produit ${productId}`);
        }
    }
    async updateStock(tx, companyId, productId, warehouseId, delta, variantId) {
        const stock = await tx.productStock.findFirst({
            where: {
                productId,
                warehouseId,
                companyId,
                variantId: variantId || null
            }
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
                    quantity: newQty,
                    variantId: variantId || null
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
        notifications_service_1.NotificationService,
        uom_service_1.UomService,
        event_emitter_1.EventEmitter2])
], StockMovementService);
//# sourceMappingURL=stock-movement.service.js.map