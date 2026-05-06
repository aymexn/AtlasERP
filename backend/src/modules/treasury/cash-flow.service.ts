import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  async get30DayForecast(companyId: string) {
    const today = startOfDay(new Date());
    const end = endOfDay(addDays(today, 30));

    // 1. Initial Cash Position (Total Payments Received - Total Expenses)
    const [totalReceived, totalSpent] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { companyId, date: { lt: today } },
        _sum: { amount: true }
      }),
      this.prisma.expense.aggregate({
        where: { companyId, date: { lt: today } },
        _sum: { amount: true }
      })
    ]);

    let runningBalance = Number(totalReceived._sum.amount || 0) - Number(totalSpent._sum.amount || 0);

    // 2. Aggregate Real Inflows (Payments today/future)
    const realInflows = await this.prisma.payment.groupBy({
      by: ['date'],
      where: { companyId, date: { gte: today, lte: end } },
      _sum: { amount: true }
    });

    // 3. Aggregate Forecast Inflows (Overdue/Due Invoices)
    // We need customer behavior for weighting, so we'll fetch details for these 30 days
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lte: end } // Include overdue ones too (position them at today)
      },
      include: { customer: { select: { paymentBehavior: true } } }
    });

    // 4. Aggregate Expenses (Outflow)
    const operationalExpenses = await this.prisma.expense.groupBy({
      by: ['date'],
      where: { companyId, date: { gte: today, lte: end } },
      _sum: { amount: true }
    });

    // 5. Aggregate Purchase Orders (Outflow)
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        OR: [
          { expectedDate: { gte: today, lte: end } },
          { orderDate: { gte: today, lte: end }, status: 'RECEIVED' }
        ]
      }
    });

    // Preparation maps for efficient daily lookup
    const realInflowMap = new Map(realInflows.map(i => [format(i.date, 'yyyy-MM-dd'), Number(i._sum.amount || 0)]));
    const expenseMap = new Map(operationalExpenses.map(e => [format(e.date, 'yyyy-MM-dd'), Number(e._sum.amount || 0)]));

    const forecast = [];
    
    for (let i = 0; i <= 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Calculate Day Inflow
      const dailyRealInflow = realInflowMap.get(dateStr) || 0;
      const dailyForecastInflow = pendingInvoices
        .filter(inv => {
            const dueDate = inv.dueDate ? startOfDay(inv.dueDate) : today;
            // Overdue invoices are considered due "today"
            if (i === 0) return dueDate <= today;
            return dueDate.getTime() === date.getTime();
        })
        .reduce((sum, inv) => {
          let factor = 0.85;
          if (inv.customer?.paymentBehavior === 'EXCELLENT') factor = 0.98;
          if (inv.customer?.paymentBehavior === 'POOR') factor = 0.50;
          return sum + (Number(inv.amountRemaining) * factor);
        }, 0);

      const inflow = dailyRealInflow + dailyForecastInflow;

      // Calculate Day Outflow
      const dailyExpense = expenseMap.get(dateStr) || 0;
      const dailyPurchases = purchaseOrders
        .filter(po => {
            const targetDate = po.status === 'RECEIVED' ? (po.orderDate || po.createdAt) : (po.expectedDate || po.orderDate);
            return startOfDay(new Date(targetDate)).getTime() === date.getTime();
        })
        .reduce((sum, po) => sum + Number(po.totalTtc), 0);

      const outflow = dailyExpense + dailyPurchases;

      // Final Day Stats
      const net = inflow - outflow;
      runningBalance += net;

      forecast.push({
        date: date.toISOString(),
        inflow,
        outflow,
        netPosition: net,
        projectedBalance: runningBalance
      });
    }

    return forecast;
  }
}
