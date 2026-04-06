import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.expense.findMany({
      where: { companyId },
      include: { supplier: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, companyId },
      include: { supplier: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(companyId: string, data: any) {
    const { supplierId, ...rest } = data;
    
    return this.prisma.expense.create({
      data: {
        ...rest,
        companyId,
        date: data.date ? new Date(data.date) : new Date(),
        supplierId: supplierId || null,
        paymentMethod: data.paymentMethod || PaymentMethod.CASH,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    
    const { supplierId, ...rest } = data;

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...rest,
        date: data.date ? new Date(data.date) : undefined,
        supplierId: supplierId !== undefined ? (supplierId || null) : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getStats(companyId: string) {
      const expenses = await this.prisma.expense.groupBy({
          by: ['category'],
          where: { companyId },
          _sum: { amount: true }
      });

      return expenses.map(e => ({
          category: e.category,
          total: Number(e._sum.amount || 0)
      }));
  }
}
