import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  async getCollectionPriority(companyId: string) {
    const today = new Date();
    const customers = await this.prisma.customer.findMany({
      where: {
        companyId,
        invoices: {
          some: { status: { in: ['SENT', 'PARTIAL'] }, dueDate: { lt: today } }
        }
      },
      include: {
        invoices: {
          where: { status: { in: ['SENT', 'PARTIAL'] }, dueDate: { lt: today } },
          orderBy: { dueDate: 'asc' }
        },
        collectionActivities: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const queue = (customers as any[]).map(customer => {
      const totalOverdue = customer.invoices.reduce((sum, inv) => sum + Number(inv.amountRemaining), 0);
      const oldestInvoice = customer.invoices[0];
      const dueDate = oldestInvoice.dueDate || oldestInvoice.date;
      const daysOverdue = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // riskScore = amountOverdue × Math.log(daysOverdue + 1)
      const riskScore = totalOverdue * Math.log(daysOverdue + 1);

      return {
        id: customer.id,
        name: customer.name,
        totalOverdue,
        oldestInvoiceRef: oldestInvoice.reference,
        daysOverdue,
        riskScore,
        lastActivity: customer.collectionActivities[0] || null,
        paymentBehavior: customer.paymentBehavior,
      };
    });

    return queue.sort((a, b) => b.riskScore - a.riskScore);
  }

  async logActivity(companyId: string, data: any) {
    return this.prisma.collectionActivity.create({
      data: {
        companyId,
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        type: data.activityType,
        notes: data.notes,
        actionDate: new Date(),
        followUpDate: data.nextAction ? new Date(data.nextAction) : null,
      }
    });
  }

  async getActivities(companyId: string, customerId: string) {
    return this.prisma.collectionActivity.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
      include: { invoice: true }
    });
  }
}
