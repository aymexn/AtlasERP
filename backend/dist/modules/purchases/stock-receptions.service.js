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
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
let StockReceptionsService = class StockReceptionsService {
    constructor(prisma, stockMovementService, eventEmitter) {
        this.prisma = prisma;
        this.stockMovementService = stockMovementService;
        this.eventEmitter = eventEmitter;
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
        if (!id || id.length !== 36) {
            throw new common_1.BadRequestException(`ID de réception invalide.`);
        }
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
        if (!id || id.length !== 36) {
            throw new common_1.BadRequestException(`ID de réception invalide.`);
        }
        const reception = await this.prisma.stockReception.findFirst({
            where: { id, companyId }
        });
        if (!reception)
            throw new common_1.NotFoundException('Réception introuvable.');
        if (reception.status === client_1.ReceptionStatus.VALIDATED)
            throw new common_1.BadRequestException('Déjà validée.');
        const result = await this.prisma.$transaction(async (tx) => {
            await this.stockMovementService.validateReception(companyId, userId, id, tx);
            return tx.stockReception.findUnique({
                where: { id },
                include: {
                    purchaseOrder: { include: { supplier: true } },
                    lines: { include: { product: true } }
                }
            });
        });
        this.eventEmitter.emit('dashboard.refresh', { companyId });
        return result;
    }
    async update(id, companyId, dto) {
        if (!id || id.length !== 36) {
            throw new common_1.BadRequestException(`ID de réception invalide.`);
        }
        const reception = await this.prisma.stockReception.findFirst({
            where: { id, companyId },
            include: { lines: { include: { purchaseLine: true } } }
        });
        if (!reception)
            throw new common_1.NotFoundException('Réception introuvable.');
        if (reception.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Seules les réceptions en brouillon peuvent être modifiées.');
        }
        return this.prisma.$transaction(async (tx) => {
            if (dto.notes !== undefined || dto.warehouseId !== undefined) {
                await tx.stockReception.update({
                    where: { id },
                    data: {
                        notes: dto.notes,
                        warehouseId: dto.warehouseId
                    }
                });
            }
            if (dto.lines && Array.isArray(dto.lines)) {
                for (const lineDto of dto.lines) {
                    const line = reception.lines.find(l => l.id === lineDto.id);
                    if (line) {
                        const newQty = Number(lineDto.receivedQty);
                        if (line.purchaseLine) {
                            const orderedQty = Number(line.purchaseLine.quantity);
                            const previouslyReceived = Number(line.purchaseLine.receivedQty);
                            if (previouslyReceived + newQty > orderedQty) {
                                throw new common_1.BadRequestException(`Sur-réception détectée pour ${line.productId}. ` +
                                    `Commandé: ${orderedQty}, Déjà reçu: ${previouslyReceived}, Tentative: ${newQty}`);
                            }
                        }
                        await tx.stockReceptionLine.update({
                            where: { id: line.id },
                            data: { receivedQty: newQty }
                        });
                    }
                }
            }
            return tx.stockReception.findUnique({
                where: { id },
                include: { lines: { include: { product: true } } }
            });
        });
    }
};
exports.StockReceptionsService = StockReceptionsService;
exports.StockReceptionsService = StockReceptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService,
        event_emitter_1.EventEmitter2])
], StockReceptionsService);
//# sourceMappingURL=stock-receptions.service.js.map