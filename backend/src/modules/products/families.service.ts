import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';

@Injectable()
export class FamiliesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
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

    async create(companyId: string, dto: CreateFamilyDto) {
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

    async update(id: string, companyId: string, dto: UpdateFamilyDto) {
        // Prevent setting self as parent
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

    async remove(id: string, companyId: string) {
        const family = await this.prisma.productFamily.findFirst({
            where: { id, companyId },
        });

        if (!family) {
            throw new NotFoundException(`Family with ID ${id} not found`);
        }

        return this.prisma.productFamily.delete({
            where: { id },
        });
    }
}
