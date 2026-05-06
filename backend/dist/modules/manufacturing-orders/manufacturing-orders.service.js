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
exports.ManufacturingOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_movement_service_1 = require("../inventory/services/stock-movement.service");
const client_1 = require("@prisma/client");
let ManufacturingOrdersService = class ManufacturingOrdersService {
    constructor(prisma, stockMovementService) {
        this.prisma = prisma;
        this.stockMovementService = stockMovementService;
    }
    generateReference() {
        const date = new Date();
        const prefix = 'MO';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000).toString();
        return `${prefix}-${year}${month}-${random}`;
    }
    async create(companyId, createDto) {
        const product = await this.prisma.product.findFirst({
            where: { id: createDto.productId, companyId }
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const formula = await this.prisma.billOfMaterials.findFirst({
            where: { id: createDto.formulaId, companyId, productId: createDto.productId },
            include: {
                components: {
                    include: { component: true }
                }
            }
        });
        if (!formula)
            throw new common_1.NotFoundException('Formula not found or does not belong to product');
        if (Number(createDto.plannedQuantity) <= 0) {
            throw new common_1.BadRequestException('Planned quantity must be greater than zero');
        }
        const plannedQty = new client_1.Prisma.Decimal(createDto.plannedQuantity);
        const formulaOutput = formula.outputQuantity;
        const scaleFactor = plannedQty.dividedBy(formulaOutput);
        let totalEstimatedCost = new client_1.Prisma.Decimal(0);
        const orderLines = formula.components.map(line => {
            const requiredQty = line.quantity.mul(scaleFactor);
            const standardCost = line.component.standardCost || new client_1.Prisma.Decimal(0);
            const purchasePrice = line.component.purchasePriceHt || new client_1.Prisma.Decimal(0);
            const unitCost = Number(standardCost) > 0 ? standardCost :
                (Number(purchasePrice) > 0 ? purchasePrice : new client_1.Prisma.Decimal(0));
            const estimatedLineCost = requiredQty.mul(unitCost);
            totalEstimatedCost = totalEstimatedCost.add(estimatedLineCost);
            return {
                componentProductId: line.componentProductId,
                bomComponentId: line.id,
                requiredQuantity: requiredQty,
                unit: line.unit,
                wastagePercent: line.wastagePercent,
                estimatedUnitCost: unitCost,
                estimatedLineCost: estimatedLineCost
            };
        });
        return this.prisma.manufacturingOrder.create({
            data: {
                companyId,
                reference: this.generateReference(),
                productId: createDto.productId,
                formulaId: createDto.formulaId,
                plannedQuantity: plannedQty,
                unit: formula.outputUnit,
                plannedDate: new Date(createDto.plannedDate),
                notes: createDto.notes,
                warehouseId: createDto.warehouseId,
                totalEstimatedCost,
                lines: {
                    create: orderLines
                }
            },
            include: {
                product: true,
                formula: true,
                lines: {
                    include: { component: true }
                }
            }
        });
    }
    async findAll(companyId, status) {
        const where = { companyId };
        if (status) {
            where.status = status;
        }
        const orders = await this.prisma.manufacturingOrder.findMany({
            where,
            include: {
                product: true,
                formula: true,
                lines: {
                    include: {
                        component: {
                            select: { stockQuantity: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        const warehouseIds = [...new Set(orders.map(o => o.warehouseId).filter(Boolean))];
        const warehouseStockMaps = new Map();
        for (const wid of warehouseIds) {
            const stocks = await this.prisma.productStock.findMany({ where: { companyId, warehouseId: wid } });
            const reserved = await this.prisma.manufacturingOrderLine.groupBy({
                by: ['componentProductId'],
                where: {
                    manufacturingOrder: {
                        companyId,
                        warehouseId: wid,
                        status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] }
                    }
                },
                _sum: { requiredQuantity: true }
            });
            const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
            const availMap = new Map();
            stocks.forEach(s => availMap.set(s.productId, Math.max(0, Number(s.quantity) - (resMap.get(s.productId) || 0))));
            warehouseStockMaps.set(wid, availMap);
        }
        const enrichedOrders = [];
        for (const order of orders) {
            const orderJson = JSON.parse(JSON.stringify(order));
            let blockingShortage = false;
            let partialShortage = false;
            const targetWarehouseId = order.warehouseId;
            const stockMap = targetWarehouseId ? warehouseStockMaps.get(targetWarehouseId) : null;
            for (const line of orderJson.lines) {
                let available = 0;
                if (stockMap) {
                    available = stockMap.get(line.componentProductId) || 0;
                }
                else {
                    available = Number(line.component.stockQuantity);
                }
                const required = Number(line.requiredQuantity);
                if (available <= 0 && required > 0) {
                    blockingShortage = true;
                }
                else if (available < required) {
                    partialShortage = true;
                }
            }
            if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
                orderJson.stockReadiness = 'EXECUTED';
            }
            else if (blockingShortage) {
                orderJson.stockReadiness = 'BLOCKING';
            }
            else if (partialShortage) {
                orderJson.stockReadiness = 'PARTIAL';
            }
            else {
                orderJson.stockReadiness = 'READY';
            }
            enrichedOrders.push(orderJson);
        }
        return enrichedOrders;
    }
    async findOne(companyId, id) {
        const order = await this.prisma.manufacturingOrder.findFirst({
            where: { id, companyId },
            include: {
                product: true,
                formula: true,
                warehouse: true,
                lines: {
                    include: { component: true }
                }
            }
        });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        const orderWithStock = JSON.parse(JSON.stringify(order));
        let targetWarehouseId = order.warehouseId;
        let resolvedWarehouse = order.warehouse;
        if (!targetWarehouseId) {
            const warehouse = await this.prisma.warehouse.findFirst({
                where: { companyId, isActive: true },
                orderBy: { createdAt: 'asc' }
            });
            targetWarehouseId = warehouse?.id || null;
            resolvedWarehouse = warehouse;
        }
        orderWithStock.warehouse = resolvedWarehouse;
        const stocks = await this.prisma.productStock.findMany({ where: { companyId, warehouseId: targetWarehouseId } });
        const reserved = await this.prisma.manufacturingOrderLine.groupBy({
            by: ['componentProductId'],
            where: {
                manufacturingOrder: {
                    companyId,
                    warehouseId: targetWarehouseId,
                    status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] }
                }
            },
            _sum: { requiredQuantity: true }
        });
        const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
        const availMap = new Map();
        stocks.forEach(s => availMap.set(s.productId, Math.max(0, Number(s.quantity) - (resMap.get(s.productId) || 0))));
        for (const line of orderWithStock.lines) {
            const currentStock = availMap.get(line.componentProductId) || 0;
            const required = Number(line.requiredQuantity);
            line.availableStock = currentStock;
            line.shortageQuantity = Math.max(0, required - currentStock);
            if (currentStock >= required) {
                line.stockStatus = 'ENOUGH';
            }
            else if (currentStock > 0) {
                line.stockStatus = 'LOW';
            }
            else {
                line.stockStatus = 'INSUFFICIENT';
            }
        }
        return orderWithStock;
    }
    async update(companyId, id, updateDto) {
        const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot update order in ${order.status} status`);
        }
        const data = {};
        if (updateDto.notes !== undefined)
            data.notes = updateDto.notes;
        if (updateDto.plannedDate)
            data.plannedDate = new Date(updateDto.plannedDate);
        return this.prisma.manufacturingOrder.update({
            where: { id },
            data,
            include: { product: true }
        });
    }
    async plan(companyId, id) {
        const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        if (order.status !== 'DRAFT') {
            throw new common_1.BadRequestException(`Cannot plan order in ${order.status} status. It must be in DRAFT.`);
        }
        return this.prisma.manufacturingOrder.update({
            where: { id },
            data: { status: 'PLANNED' }
        });
    }
    async start(companyId, userId, id) {
        const order = await this.prisma.manufacturingOrder.findFirst({
            where: { id, companyId },
            include: { lines: { include: { component: true } } }
        });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        if (order.status === 'IN_PROGRESS')
            return order;
        if (!['PLANNED', 'DRAFT'].includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot start production from ${order.status} status.`);
        }
        const warehouseId = order.warehouseId;
        if (!warehouseId)
            throw new common_1.BadRequestException('Warehouse must be assigned to start production.');
        const stocks = await this.prisma.productStock.findMany({ where: { companyId, warehouseId } });
        const reserved = await this.prisma.manufacturingOrderLine.groupBy({
            by: ['componentProductId'],
            where: {
                manufacturingOrder: {
                    companyId,
                    warehouseId,
                    status: { in: ['DRAFT', 'PLANNED', 'IN_PROGRESS'] }
                }
            },
            _sum: { requiredQuantity: true }
        });
        const resMap = new Map(reserved.map(r => [r.componentProductId, Number(r._sum.requiredQuantity || 0)]));
        const shortages = [];
        for (const line of order.lines) {
            const stock = stocks.find(s => s.productId === line.componentProductId);
            const physical = Number(stock?.quantity || 0);
            const res = resMap.get(line.componentProductId) || 0;
            const available = Math.max(0, physical - res);
            if (available < Number(line.requiredQuantity)) {
                shortages.push(`${line.component.name} (Required: ${line.requiredQuantity}, Available: ${available})`);
            }
        }
        if (shortages.length > 0) {
            throw new common_1.BadRequestException(`Impossible to start production. Missing components: ${shortages.join(', ')}`);
        }
        return await this.prisma.manufacturingOrder.update({
            where: { id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
            }
        });
    }
    async complete(companyId, userId, id, dto) {
        const order = await this.prisma.manufacturingOrder.findFirst({
            where: { id, companyId },
            include: {
                product: true,
                lines: { include: { component: true } }
            }
        });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        if (order.status !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('Order must be in IN_PROGRESS status to complete');
        let warehouseId = order.warehouseId;
        if (!warehouseId) {
            const warehouse = await this.prisma.warehouse.findFirst({
                where: { companyId, isActive: true },
                orderBy: { createdAt: 'asc' }
            });
            if (!warehouse)
                throw new common_1.BadRequestException('No active warehouse found for production.');
            warehouseId = warehouse.id;
        }
        await this.stockMovementService.completeManufacturingOrder(companyId, userId, id, warehouseId);
        return await this.prisma.manufacturingOrder.findUnique({
            where: { id },
            include: { product: true, lines: true }
        });
    }
    async cancel(companyId, id) {
        const order = await this.prisma.manufacturingOrder.findFirst({ where: { id, companyId } });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot cancel order in ${order.status} status`);
        }
        return this.prisma.manufacturingOrder.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
    async findForPdf(companyId, id) {
        const where = { id };
        if (companyId) {
            where.companyId = companyId;
        }
        const order = await this.prisma.manufacturingOrder.findFirst({
            where,
            include: {
                company: true,
                product: true,
                formula: true,
                lines: {
                    include: { component: true }
                }
            }
        });
        if (!order)
            throw new common_1.NotFoundException('Manufacturing order not found');
        return order;
    }
};
exports.ManufacturingOrdersService = ManufacturingOrdersService;
exports.ManufacturingOrdersService = ManufacturingOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService])
], ManufacturingOrdersService);
//# sourceMappingURL=manufacturing-orders.service.js.map