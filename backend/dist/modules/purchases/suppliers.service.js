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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stock_movement_service_1 = require("../inventory/services/stock-movement.service");
let SuppliersService = class SuppliersService {
    constructor(prisma, stockMovementService) {
        this.prisma = prisma;
        this.stockMovementService = stockMovementService;
    }
    async list(companyId) {
        console.log(`[SuppliersService.list] Fetching for companyId: ${companyId}`);
        try {
            if (!companyId)
                throw new common_1.BadRequestException('Company ID is required');
            return await this.prisma.supplier.findMany({
                where: { companyId },
                include: {
                    _count: {
                        select: {
                            purchaseOrders: true,
                            expenses: true
                        }
                    }
                },
                orderBy: { name: 'asc' },
            });
        }
        catch (error) {
            console.error('SuppliersService.list Error:', error);
            throw error;
        }
    }
    async generateReference(companyId) {
        const count = await this.prisma.supplier.count({
            where: { companyId }
        });
        return `FR-${(count + 1).toString().padStart(4, '0')}`;
    }
    async findOne(id, companyId) {
        if (!id || !companyId)
            throw new common_1.BadRequestException('ID and Company ID are required');
        const supplier = await this.prisma.supplier.findFirst({
            where: { id, companyId },
            include: {
                _count: {
                    select: {
                        purchaseOrders: true,
                        expenses: true
                    }
                }
            }
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Fournisseur avec l'ID ${id} introuvable.`);
        }
        return supplier;
    }
    async create(companyId, dto) {
        console.log(`[SuppliersService.create] Called for companyId: ${companyId}`);
        try {
            if (!companyId)
                throw new common_1.BadRequestException('Company ID is required');
            if (dto.code) {
                const existing = await this.prisma.supplier.findFirst({
                    where: { companyId, code: dto.code },
                });
                if (existing) {
                    throw new common_1.BadRequestException(`Un fournisseur avec le code ${dto.code} existe déjà.`);
                }
            }
            const data = {
                ...dto,
                companyId,
            };
            if (!data.code) {
                data.code = await this.generateReference(companyId);
            }
            return await this.prisma.supplier.create({
                data,
            });
        }
        catch (error) {
            console.error('SuppliersService.create Error:', error);
            throw error;
        }
    }
    async update(id, companyId, dto) {
        await this.findOne(id, companyId);
        if (dto.code) {
            const existing = await this.prisma.supplier.findFirst({
                where: {
                    companyId,
                    code: dto.code,
                    NOT: { id }
                },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Un fournisseur avec le code ${dto.code} existe déjà.`);
            }
        }
        return this.prisma.supplier.update({
            where: { id, companyId },
            data: dto,
        });
    }
    async remove(id, companyId) {
        const supplier = await this.prisma.supplier.findFirst({
            where: { id, companyId },
            include: {
                _count: {
                    select: { purchaseOrders: true }
                }
            }
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Fournisseur introuvable.`);
        }
        if (supplier._count.purchaseOrders > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer un fournisseur ayant des bons de commande rattachés.`);
        }
        return this.prisma.supplier.delete({
            where: { id, companyId },
        });
    }
    async getStats(companyId) {
        const [totalSuppliers, activeSuppliers, suppliersWithOrders] = await Promise.all([
            this.prisma.supplier.count({ where: { companyId } }),
            this.prisma.supplier.count({ where: { companyId, isActive: true } }),
            this.prisma.supplier.findMany({
                where: { companyId },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: { purchaseOrders: true }
                    }
                }
            })
        ]);
        return {
            totalSuppliers,
            activeSuppliers,
            suppliersWithOrders
        };
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map