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
let SuppliersService = class SuppliersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
        return this.prisma.supplier.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id, companyId) {
        const supplier = await this.prisma.supplier.findFirst({
            where: { id, companyId },
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Fournisseur avec l'ID ${id} introuvable.`);
        }
        return supplier;
    }
    async create(companyId, dto) {
        if (dto.code) {
            const existing = await this.prisma.supplier.findFirst({
                where: { companyId, code: dto.code },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Un fournisseur avec le code ${dto.code} existe déjà.`);
            }
        }
        return this.prisma.supplier.create({
            data: {
                ...dto,
                companyId,
            },
        });
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
            where: { id },
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
            where: { id },
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map