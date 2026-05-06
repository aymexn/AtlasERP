import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerSegment, PaymentBehavior, RiskLevel } from '@prisma/client';

/**
 * Auto-classification service for customers.
 * Thresholds (adjusted for simulation):
 *   Segment A (Gold):    > 5,000,000 DA
 *   Segment B (Silver): 1,500,000 – 5,000,000 DA
 *   Segment C (Standard): < 1,500,000 DA
 */
@Injectable()
export class CustomerClassificationService {
  constructor(private prisma: PrismaService) {}

  async recalculateCustomerStats(companyId: string, customerId: string): Promise<void> {
    // 1. Fetch all non-cancelled invoices for this customer
    const invoices = await this.prisma.invoice.findMany({
      where: {
        customerId,
        companyId,
        status: { not: 'CANCELLED' },
      },
      include: {
        payments: {
          orderBy: { date: 'asc' },
        },
      },
    });

    // 2. Calculate total revenue (sum of all invoice HT amounts)
    const totalRevenue = invoices.reduce(
      (acc, inv) => acc + Number(inv.totalAmountHt || 0),
      0,
    );

    // 3. Determine Segment based on adjusted thresholds
    let segment: CustomerSegment;
    if (totalRevenue >= 5_000_000) {
      segment = CustomerSegment.A;
    } else if (totalRevenue >= 1_500_000) {
      segment = CustomerSegment.B;
    } else {
      segment = CustomerSegment.C;
    }

    // 4. Calculate average payment delay (invoice date → first payment date)
    const paymentDelays: number[] = [];
    for (const invoice of invoices) {
      if (invoice.payments.length > 0) {
        const invoiceDate = new Date(invoice.date).getTime();
        // Use the first payment date as reference
        const firstPaymentDate = new Date(invoice.payments[0].date).getTime();
        const delayDays = Math.round(
          (firstPaymentDate - invoiceDate) / (1000 * 60 * 60 * 24),
        );
        if (delayDays >= 0) {
          paymentDelays.push(delayDays);
        }
      }
    }

    const avgPaymentDelay =
      paymentDelays.length > 0
        ? Math.round(
            paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length,
          )
        : 0;

    // 5. Classify payment behavior
    let paymentBehavior: PaymentBehavior;
    if (avgPaymentDelay === 0 && paymentDelays.length === 0) {
      // No payments recorded yet - neutral
      paymentBehavior = PaymentBehavior.GOOD;
    } else if (avgPaymentDelay <= 15) {
      paymentBehavior = PaymentBehavior.EXCELLENT;
    } else if (avgPaymentDelay <= 30) {
      paymentBehavior = PaymentBehavior.GOOD;
    } else if (avgPaymentDelay <= 60) {
      paymentBehavior = PaymentBehavior.AVERAGE;
    } else {
      paymentBehavior = PaymentBehavior.POOR;
    }

    // 6. Calculate outstanding balance across all invoices
    const outstandingBalance = invoices.reduce(
      (acc, inv) => acc + Number(inv.amountRemaining || 0),
      0,
    );

    // 7. Classify risk level
    // Risk factors: payment behavior + outstanding / revenue ratio
    let riskLevel: RiskLevel;
    const outstandingRatio = totalRevenue > 0 ? outstandingBalance / totalRevenue : 0;

    if (paymentBehavior === PaymentBehavior.POOR || outstandingRatio > 0.6) {
      riskLevel = RiskLevel.HIGH;
    } else if (
      paymentBehavior === PaymentBehavior.AVERAGE ||
      outstandingRatio > 0.3
    ) {
      riskLevel = RiskLevel.MEDIUM;
    } else {
      riskLevel = RiskLevel.LOW;
    }

    // 8. Persist updated stats
    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalRevenue,
        segment,
        paymentBehavior,
        riskLevel,
        avgPaymentDelay,
      },
    });
  }

  /**
   * Batch recalculate all customers for a company.
   * Useful for initial seeding or cron jobs.
   */
  async recalculateAllCustomers(companyId: string): Promise<void> {
    const customers = await this.prisma.customer.findMany({
      where: { companyId, isActive: true },
      select: { id: true },
    });

    for (const customer of customers) {
      await this.recalculateCustomerStats(companyId, customer.id);
    }
  }
}
