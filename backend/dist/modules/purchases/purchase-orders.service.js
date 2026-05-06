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
exports.PurchaseOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_movement_service_1 = require("../inventory/services/stock-movement.service");
const create_movement_dto_1 = require("../inventory/dto/create-movement.dto");
let PurchaseOrdersService = class PurchaseOrdersService {
    constructor(prisma, stockMovementService) {
        this.prisma = prisma;
        this.stockMovementService = stockMovementService;
    }
    async generateReference(companyId) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const prefix = `BCF-${yearMonth}-`;
        const lastOrder = await this.prisma.purchaseOrder.findFirst({
            where: {
                companyId,
                reference: { startsWith: prefix }
            },
            orderBy: { reference: 'desc' },
            select: { reference: true }
        });
        let sequence = 1;
        if (lastOrder) {
            const parts = lastOrder.reference.split('-');
            const lastSequence = parseInt(parts[parts.length - 1]);
            sequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
        }
        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }
    async list(companyId, status) {
        console.log(`[PurchaseOrdersService.list] Fetching for companyId: ${companyId}`);
        return this.prisma.purchaseOrder.findMany({
            where: {
                companyId,
                ...(status ? { status } : {})
            },
            include: {
                supplier: true,
                lines: {
                    include: { product: true }
                },
                _count: {
                    select: {
                        lines: true,
                        stockReceptions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id, companyId) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId },
            include: {
                supplier: true,
                company: true,
                lines: {
                    include: { product: true }
                },
                stockReceptions: {
                    include: {
                        warehouse: true,
                        _count: { select: { lines: true } }
                    }
                }
            }
        });
        if (!order) {
            throw new common_1.NotFoundException(`Bon de commande introuvable.`);
        }
        return order;
    }
    async create(companyId, dto) {
        console.log(`[PurchaseOrdersService.create] Called for companyId: ${companyId}`);
        try {
            if (!companyId)
                throw new common_1.BadRequestException('Company ID is required');
            const supplier = await this.prisma.supplier.findFirst({
                where: { id: dto.supplierId, companyId }
            });
            if (!supplier)
                throw new common_1.BadRequestException('Fournisseur invalide.');
            let totalHt = 0;
            let totalTva = 0;
            const lineData = [];
            for (const line of dto.lines) {
                const product = await this.prisma.product.findFirst({
                    where: { id: line.productId, companyId }
                });
                if (!product)
                    throw new common_1.BadRequestException(`Produit ID ${line.productId} invalide.`);
                const qty = Number(line.quantity) || 0;
                const price = Number(line.unitPriceHt) || 0;
                const tax = Number(line.taxRate || 0.19);
                const lineTotalHt = Number((qty * price).toFixed(2));
                const lineTotalTva = Number((lineTotalHt * tax).toFixed(2));
                totalHt += lineTotalHt;
                totalTva += lineTotalTva;
                lineData.push({
                    productId: line.productId,
                    quantity: qty,
                    unit: line.unit,
                    unitPriceHt: price,
                    taxRate: tax,
                    totalHt: lineTotalHt,
                    note: line.note
                });
            }
            const totalTtc = Number((totalHt + totalTva).toFixed(2));
            let reference;
            try {
                reference = await this.generateReference(companyId);
            }
            catch (refError) {
                console.error('Reference Generation Error:', refError);
                reference = `BC-TEMP-${Date.now()}`;
            }
            const finalStatus = dto.status || 'DRAFT';
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.purchaseOrder.create({
                    data: {
                        companyId,
                        reference,
                        supplierId: dto.supplierId,
                        orderDate: new Date(dto.orderDate),
                        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
                        notes: dto.notes,
                        status: finalStatus,
                        totalHt: Number(totalHt.toFixed(2)),
                        totalTva: Number(totalTva.toFixed(2)),
                        totalTtc: Number(totalTtc.toFixed(2)),
                        lines: {
                            create: lineData.map(l => ({
                                productId: l.productId,
                                quantity: Number(l.quantity),
                                unit: l.unit,
                                unitPriceHt: Number(l.unitPriceHt),
                                taxRate: Number(l.taxRate),
                                totalHt: Number(l.totalHt),
                                note: l.note,
                                receivedQty: finalStatus === 'RECEIVED' ? Number(l.quantity) : 0
                            }))
                        }
                    },
                    include: {
                        supplier: true,
                        lines: { include: { product: true } }
                    }
                });
                if (finalStatus === 'RECEIVED') {
                    let warehouseId = dto.warehouseId;
                    if (!warehouseId) {
                        const defaultWarehouse = await tx.warehouse.findFirst({
                            where: { companyId, isActive: true },
                            orderBy: { createdAt: 'asc' }
                        });
                        if (!defaultWarehouse)
                            throw new common_1.BadRequestException('Aucun entrepôt actif trouvé pour l\'entrée en stock.');
                        warehouseId = defaultWarehouse.id;
                    }
                    const now = new Date();
                    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
                    const receptionPrefix = `REC-${yearMonth}-`;
                    const lastRec = await tx.stockReception.findFirst({
                        where: { companyId, reference: { startsWith: receptionPrefix } },
                        orderBy: { reference: 'desc' },
                        select: { reference: true }
                    });
                    let recSequence = 1;
                    if (lastRec) {
                        const parts = lastRec.reference.split('-');
                        const lastSeq = parseInt(parts[parts.length - 1]);
                        recSequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
                    }
                    const receptionReference = `${receptionPrefix}${String(recSequence).padStart(4, '0')}`;
                    const reception = await tx.stockReception.create({
                        data: {
                            companyId,
                            reference: receptionReference,
                            purchaseOrderId: order.id,
                            warehouseId: warehouseId,
                            status: 'VALIDATED',
                            notes: 'Réception automatique lors de l\'achat direct',
                            lines: {
                                create: order.lines.map(line => ({
                                    productId: line.productId,
                                    purchaseLineId: line.id,
                                    expectedQty: Number(line.quantity),
                                    receivedQty: Number(line.quantity),
                                    unit: line.unit,
                                    unitCost: Number(line.unitPriceHt)
                                }))
                            }
                        }
                    });
                    for (const line of order.lines) {
                        await this.stockMovementService.createMovement(companyId, null, {
                            productId: line.productId,
                            quantity: Number(line.quantity),
                            type: create_movement_dto_1.MovementType.IN,
                            warehouseId: warehouseId,
                            reference: order.reference,
                            reason: `Réception Directe BCF ${order.reference}`,
                            unitCost: Number(line.unitPriceHt),
                            unit: line.unit
                        }, tx);
                    }
                }
                return order;
            });
        }
        catch (error) {
            console.error('PurchaseOrdersService.create Error:', error);
            throw error;
        }
    }
    async confirm(id, companyId) {
        const order = await this.findOne(id, companyId);
        if (order.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Seuls les brouillons peuvent être confirmés.');
        }
        if (order.lines.length === 0) {
            throw new common_1.BadRequestException('Le bon de commande doit avoir au moins une ligne.');
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'CONFIRMED' }
        });
    }
    async send(id, companyId) {
        const order = await this.findOne(id, companyId);
        if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
            throw new common_1.BadRequestException('Statut invalide pour l\'envoi.');
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'SENT' }
        });
    }
    async cancel(id, companyId) {
        const order = await this.findOne(id, companyId);
        if (!['DRAFT', 'SENT'].includes(order.status)) {
            throw new common_1.BadRequestException('Impossible d\'annuler une commande à ce stade.');
        }
        if (order.stockReceptions.length > 0) {
            throw new common_1.BadRequestException('Impossible d\'annuler une commande ayant des réceptions.');
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
    async createReception(id, companyId, warehouseId, notes) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId },
            include: { lines: { include: { product: true } } }
        });
        if (!order)
            throw new common_1.NotFoundException('Bon de commande introuvable.');
        if (!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)) {
            throw new common_1.BadRequestException('Impossible de créer une réception pour une commande à ce stade.');
        }
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const prefix = `REC-${yearMonth}-`;
        const lastRec = await this.prisma.stockReception.findFirst({
            where: { companyId, reference: { startsWith: prefix } },
            orderBy: { reference: 'desc' },
            select: { reference: true }
        });
        let sequence = 1;
        if (lastRec) {
            const lastSequence = parseInt(lastRec.reference.split('-')[2]);
            sequence = lastSequence + 1;
        }
        const reference = `${prefix}${String(sequence).padStart(4, '0')}`;
        const receptionLines = order.lines
            .map(line => ({
            productId: line.productId,
            purchaseLineId: line.id,
            expectedQty: Number(line.quantity) - Number(line.receivedQty),
            receivedQty: Number(line.quantity) - Number(line.receivedQty),
            unit: line.unit,
            unitCost: line.unitPriceHt,
        }))
            .filter(line => line.expectedQty > 0);
        if (receptionLines.length === 0) {
            throw new common_1.BadRequestException('Tous les articles ont déjà été reçus pour ce bon de commande.');
        }
        return this.prisma.stockReception.create({
            data: {
                companyId,
                reference,
                purchaseOrderId: id,
                warehouseId,
                notes,
                status: 'DRAFT',
                lines: {
                    create: receptionLines
                }
            },
            include: { lines: true }
        });
    }
};
exports.PurchaseOrdersService = PurchaseOrdersService;
exports.PurchaseOrdersService = PurchaseOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService])
], PurchaseOrdersService);
//# sourceMappingURL=purchase-orders.service.js.map