import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async listWarehouses(companyId: string) {
    // If no warehouses exist, create a default one to ensure the ERP remains functional
    const count = await this.prisma.warehouse.count({
      where: { companyId },
    });

    if (count === 0) {
      await this.prisma.warehouse.create({
        data: {
          name: 'Entrepôt Principal',
          code: 'WH-MAIN',
          companyId,
        },
      });
    }

    return this.prisma.warehouse.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
