import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sku: 'asc' },
    });
  }

  async create(productId: string, data: any) {
    return this.prisma.productVariant.create({
      data: {
        ...data,
        productId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.productVariant.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.productVariant.delete({
      where: { id },
    });
  }

  /**
   * Generates a matrix of variants based on attributes.
   * attributes: { "Color": ["Red", "Blue"], "Size": ["S", "M"] }
   */
  async generateMatrix(productId: string, attributes: Record<string, string[]>) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const keys = Object.keys(attributes);
    const combinations: Record<string, string>[] = [];

    const helper = (index: number, current: Record<string, string>) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }
      const key = keys[index];
      for (const value of attributes[key]) {
        current[key] = value;
        helper(index + 1, current);
      }
    };

    helper(0, {});

    const variants = [];
    for (const combo of combinations) {
      const nameSuffix = Object.values(combo).join(' ');
      const skuSuffix = Object.values(combo).map(v => v.substring(0, 3).toUpperCase()).join('-');
      
      const variant = await this.prisma.productVariant.create({
        data: {
          productId,
          sku: `${product.sku}-${skuSuffix}`,
          name: `${product.name} (${nameSuffix})`,
          attributeValues: combo,
          isActive: true,
        },
      });
      variants.push(variant);
    }

    return variants;
  }
}
