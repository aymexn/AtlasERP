import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays } from 'date-fns';

@Injectable()
export class AgedReceivablesService {
  constructor(private prisma: PrismaService) {}

  async getAgedReceivables(companyId: string) {
    const today = new Date();
    
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'PARTIAL'] },
      },
      include: {
        customer: true,
      },
    });

    const summary = {
      totalOutstanding: 0,
      current: 0,
      late30: 0,
      late60: 0,
      late90: 0,
    };

    const customerMap = new Map();

    (invoices as any[]).forEach((invoice) => {
      const amount = Number(invoice.amountRemaining);
      const dueDate = invoice.dueDate || invoice.date;
      const daysDiff = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      summary.totalOutstanding += amount;

      let bucket = 'current';
      if (daysDiff > 90) {
        summary.late90 += amount;
        bucket = 'late90';
      } else if (daysDiff > 60) {
        summary.late60 += amount;
        bucket = 'late60';
      } else if (daysDiff > 30) {
        summary.late30 += amount;
        bucket = 'late30';
      } else {
        summary.current += amount;
        bucket = 'current';
      }

      const custId = invoice.customerId;
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          id: custId,
          name: invoice.customer.name,
          totalOutstanding: 0,
          current: 0,
          late30: 0,
          late60: 0,
          late90: 0,
          paymentBehavior: invoice.customer.paymentBehavior,
          avgPaymentDelay: invoice.customer.avgPaymentDelay,
        });
      }

      const custData = customerMap.get(custId);
      custData.totalOutstanding += amount;
      custData[bucket] += amount;
    });

    return {
      summary,
      customers: Array.from(customerMap.values()),
    };
  }

  async getCustomerAging(companyId: string, customerId: string) {
    const today = new Date();
    
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: {
          where: {
            status: { in: ['SENT', 'PARTIAL'] },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!customer) throw new Error('Customer not found');

    const buckets = {
      current: [] as any[],
      late30: [] as any[],
      late60: [] as any[],
      late90: [] as any[],
    };

    customer.invoices.forEach((inv) => {
      const dueDate = inv.dueDate || inv.date;
      const daysDiff = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const invoiceData = {
        ...inv,
        daysOverdue: Math.max(0, daysDiff),
      };

      if (daysDiff > 90) buckets.late90.push(invoiceData);
      else if (daysDiff > 60) buckets.late60.push(invoiceData);
      else if (daysDiff > 30) buckets.late30.push(invoiceData);
      else buckets.current.push(invoiceData);
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        totalRevenue: customer.totalRevenue,
        paymentBehavior: customer.paymentBehavior,
      },
      buckets,
    };
  }
}
