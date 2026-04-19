import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    console.log(`[ExpensesService.findAll] Fetching for companyId: ${companyId}`);
    return this.prisma.expense.findMany({
      where: { companyId },
      include: { supplier: true },
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
    console.log(`[ExpensesService.create] Called for companyId: ${companyId}`);
    try {
      const { supplierId, amount, ...rest } = data;
      
      return await this.prisma.expense.create({
        data: {
          ...rest,
          companyId,
          amount: Number(amount) || 0,
          date: data.date ? new Date(data.date) : new Date(),
          supplierId: supplierId || null,
          paymentMethod: data.paymentMethod || PaymentMethod.CASH,
        },
      });
    } catch (error) {
      console.error('ExpensesService.create Error:', error);
      throw error;
    }
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
