import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UomService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.unitOfMeasure.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const uom = await this.prisma.unitOfMeasure.findFirst({
      where: { id, companyId },
    });
    if (!uom) throw new NotFoundException('Unit of measure not found');
    return uom;
  }

  async create(companyId: string, data: any) {
    return this.prisma.unitOfMeasure.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async update(id: string, companyId: string, data: any) {
    return this.prisma.unitOfMeasure.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async getProductUoms(productId: string) {
    return this.prisma.productUom.findMany({
      where: { productId },
      include: { uom: true },
    });
  }

  async addProductUom(productId: string, data: any) {
    return this.prisma.productUom.create({
      data: {
        ...data,
        productId,
      },
    });
  }

  async removeProductUom(id: string) {
    return this.prisma.productUom.delete({
      where: { id },
    });
  }

  /**
   * Converts a quantity from one UoM to another for a specific product.
   * If units are different and no conversion factor is found, returns the same qty (as fallback).
   */
  async convert(quantity: number, fromUomId: string, toUomId: string, productId: string): Promise<number> {
    if (fromUomId === toUomId) return quantity;

    const productUoms = await this.prisma.productUom.findMany({
      where: { productId, uomId: { in: [fromUomId, toUomId] } },
    });

    const fromUom = productUoms.find(pu => pu.uomId === fromUomId);
    const toUom = productUoms.find(pu => pu.uomId === toUomId);

    if (!fromUom || !toUom) {
      console.warn(`[UomService] Missing UoM conversion for product ${productId}. Returning raw quantity.`);
      return quantity;
    }

    // Logic: qtyInStock = qtyInFrom * fromFactor
    // qtyInTo = qtyInStock / toFactor
    const qtyInStock = Number(quantity) * Number(fromUom.conversionFactor);
    return qtyInStock / Number(toUom.conversionFactor);
  }
}
