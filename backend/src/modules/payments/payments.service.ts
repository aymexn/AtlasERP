import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  async findAll(companyId: string) {
    return this.prisma.payment.findMany({
      where: { companyId },
      include: { 
          invoice: { 
              select: { 
                  reference: true,
                  customer: { select: { name: true } }
              } 
          } 
      },
      orderBy: { date: 'desc' },
    });
  }

  async recordPayment(companyId: string, data: any) {
    const { invoiceId, amount, method, date, reference, notes } = data;
    
    const invoice = await this.prisma.invoice.findFirst({
        where: { id: invoiceId, companyId }
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice is already fully paid');
    
    const paymentAmount = new Prisma.Decimal(amount);
    if (paymentAmount.gt(invoice.amountRemaining)) {
        throw new BadRequestException(`Payment amount exceeds remaining balance (${invoice.amountRemaining} DA)`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create the Payment record
      const payment = await tx.payment.create({
        data: {
          companyId,
          invoiceId,
          amount: paymentAmount,
          method: method || PaymentMethod.CASH,
          date: date ? new Date(date) : new Date(),
          reference,
          notes,
        },
      });

      // 2. Update Invoice totals and status
      const newAmountPaid = invoice.amountPaid.add(paymentAmount);
      const newAmountRemaining = invoice.amountRemaining.minus(paymentAmount);
      
      let newStatus = invoice.status;
      if (newAmountRemaining.isZero()) {
          newStatus = 'PAID';
      } else if (newAmountPaid.gt(0)) {
          newStatus = 'PARTIAL';
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountRemaining: newAmountRemaining,
          status: newStatus,
        },
      });

      return payment;
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }
}
