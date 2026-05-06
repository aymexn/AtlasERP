import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { subDays } from 'date-fns';

@Injectable()
export class PaymentReminderService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService
  ) {}

  async findOverdueInvoices(companyId: string) {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);

    return this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: today },
        OR: [
          { lastReminderSent: null },
          { lastReminderSent: { lt: sevenDaysAgo } }
        ]
      },
      include: {
        customer: true
      }
    });
  }

  async sendReminder(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });

    if (!invoice || !invoice.customer.email) return;

    const today = new Date();
    const dueDate = invoice.dueDate || invoice.date;
    const daysOverdue = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));

    let template = 'gentle-reminder';
    if (daysOverdue > 30) template = 'urgent-reminder';
    if (daysOverdue > 90) template = 'final-notice';

    await this.notifications.sendEmail(
      invoice.customer.email,
      `Rappel de paiement - Facture ${invoice.reference}`,
      template,
      {
        customerName: invoice.customer.name,
        invoiceNumber: invoice.reference,
        amount: invoice.amountRemaining,
        daysOverdue,
        dueDate
      }
    );

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        lastReminderSent: new Date(),
        reminderCount: { increment: 1 }
      }
    });
  }

  async sendDailyReminders(companyId: string) {
    const overdue = await this.findOverdueInvoices(companyId);
    for (const inv of overdue) {
      await this.sendReminder(inv.id);
    }
    return { total: overdue.length };
  }
}
