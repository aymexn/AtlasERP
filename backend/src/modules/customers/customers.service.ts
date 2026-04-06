import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.customer.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(companyId: string, data: any) {
    return this.prisma.customer.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false }, // Soft delete
    });
  }
}
