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
exports.FamiliesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FamiliesService = class FamiliesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        return this.prisma.productFamily.findMany({
            where: { companyId },
            include: {
                parent: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });
    }
    async create(companyId, dto) {
        const { parentId, ...rest } = dto;
        return this.prisma.productFamily.create({
            data: {
                ...rest,
                parentId: parentId || null,
                isActive: dto.isActive ?? true,
                companyId
            },
            include: {
                parent: {
                    select: { id: true, name: true }
                }
            }
        });
    }
    async update(id, companyId, dto) {
        if (dto.parentId === id) {
            throw new Error('A family cannot be its own parent');
        }
        const { parentId, ...rest } = dto;
        return this.prisma.productFamily.update({
            where: { id, companyId },
            data: {
                ...rest,
                ...(parentId !== undefined && { parentId: parentId || null }),
            },
            include: {
                parent: {
                    select: { id: true, name: true }
                }
            }
        });
    }
    async remove(id, companyId) {
        const family = await this.prisma.productFamily.findFirst({
            where: { id, companyId },
        });
        if (!family) {
            throw new common_1.NotFoundException(`Family with ID ${id} not found`);
        }
        return this.prisma.productFamily.delete({
            where: { id },
        });
    }
};
exports.FamiliesService = FamiliesService;
exports.FamiliesService = FamiliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FamiliesService);
//# sourceMappingURL=families.service.js.map