import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.supplier.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} introuvable.`);
    }

    return supplier;
  }

  async create(companyId: string, dto: CreateSupplierDto) {
    if (dto.code) {
      const existing = await this.prisma.supplier.findFirst({
        where: { companyId, code: dto.code },
      });
      if (existing) {
        throw new BadRequestException(`Un fournisseur avec le code ${dto.code} existe déjà.`);
      }
    }

    return this.prisma.supplier.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  async update(id: string, companyId: string, dto: UpdateSupplierDto) {
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
        throw new BadRequestException(`Un fournisseur avec le code ${dto.code} existe déjà.`);
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { purchaseOrders: true }
        }
      }
    });

    if (!supplier) {
      throw new NotFoundException(`Fournisseur introuvable.`);
    }

    if (supplier._count.purchaseOrders > 0) {
      throw new BadRequestException(`Impossible de supprimer un fournisseur ayant des bons de commande rattachés.`);
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }

  async getStats(companyId: string) {
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
}
