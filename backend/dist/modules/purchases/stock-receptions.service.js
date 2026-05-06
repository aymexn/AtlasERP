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
const stock_movement_service_1 = require("../inventory/services/stock-movement.service");
let StockReceptionsService = class StockReceptionsService {
    constructor(prisma, stockMovementService) {
        this.prisma = prisma;
        this.stockMovementService = stockMovementService;
    }
    async list(companyId) {
        return this.prisma.stockReception.findMany({
            where: { companyId },
            include: {
                purchaseOrder: { include: { supplier: true } },
                warehouse: true,
                lines: { include: { product: true } },
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
    async validate(id, companyId, userId) {
        const reception = await this.prisma.stockReception.findFirst({
            where: { id, companyId }
        });
        if (!reception)
            throw new common_1.NotFoundException('Réception introuvable.');
        if (reception.status === 'VALIDATED')
            throw new common_1.BadRequestException('Déjà validée.');
        return this.prisma.$transaction(async (tx) => {
            await this.stockMovementService.validateReception(companyId, userId, id, tx);
            const updatedReception = await tx.stockReception.findUnique({
                where: { id },
                include: { lines: true }
            });
            for (const line of updatedReception.lines) {
                if (line.purchaseLineId) {
                    await tx.purchaseOrderLine.update({
                        where: { id: line.purchaseLineId },
                        data: { receivedQty: { increment: line.receivedQty } }
                    });
                }
            }
            const orderLines = await tx.purchaseOrderLine.findMany({
                where: { purchaseOrderId: reception.purchaseOrderId }
            });
            const allReceived = orderLines.every(ol => Number(ol.receivedQty) >= Number(ol.quantity));
            const anyReceived = orderLines.some(ol => Number(ol.receivedQty) > 0);
            const newStatus = allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIALLY_RECEIVED' : 'CONFIRMED');
            await tx.purchaseOrder.update({
                where: { id: reception.purchaseOrderId },
                data: { status: newStatus }
            });
            return tx.stockReception.findUnique({
                where: { id },
                include: {
                    purchaseOrder: { include: { supplier: true } },
                    lines: { include: { product: true } }
                }
            });
        });
    }
};
exports.StockReceptionsService = StockReceptionsService;
exports.StockReceptionsService = StockReceptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService])
], StockReceptionsService);
//# sourceMappingURL=stock-receptions.service.js.map