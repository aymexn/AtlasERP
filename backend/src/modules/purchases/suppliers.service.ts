import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { StockMovementService } from '../inventory/services/stock-movement.service';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService,
  ) {}

  async list(companyId: string) {
    console.log(`[SuppliersService.list] Fetching for companyId: ${companyId}`);
    try {
      if (!companyId) throw new BadRequestException('Company ID is required');
      
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
    } catch (error) {
      console.error('SuppliersService.list Error:', error);
      throw error;
    }
  }

  private async generateReference(companyId: string): Promise<string> {
    const count = await this.prisma.supplier.count({
      where: { companyId }
    });
    return `FR-${(count + 1).toString().padStart(4, '0')}`;
  }

  async findOne(id: string, companyId: string) {
    if (!id || !companyId) throw new BadRequestException('ID and Company ID are required');
    
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
      throw new NotFoundException(`Fournisseur avec l'ID ${id} introuvable.`);
    }

    return supplier;
  }

  async create(companyId: string, dto: CreateSupplierDto) {
    console.log(`[SuppliersService.create] Called for companyId: ${companyId}`);
    try {
      if (!companyId) throw new BadRequestException('Company ID is required');

      if (dto.code) {
        const existing = await this.prisma.supplier.findFirst({
          where: { companyId, code: dto.code },
        });
        if (existing) {
          throw new BadRequestException(`Un fournisseur avec le code ${dto.code} existe déjà.`);
        }
      }

      const data: any = {
        ...dto,
        companyId,
      };

      if (!data.code) {
        data.code = await this.generateReference(companyId);
      }

      return await this.prisma.supplier.create({
        data,
      });
    } catch (error) {
      console.error('SuppliersService.create Error:', error);
      throw error;
    }
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
      where: { id, companyId },
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
      where: { id, companyId },
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
