import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId },
      include: { 
        customer: true, 
        payments: true,
        salesOrder: { 
          include: { 
            lines: { include: { product: true } } 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: { 
        customer: true,
        company: true,
        salesOrder: { 
          include: { 
            lines: { include: { product: true } } 
          } 
        },
        payments: true
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /**
   * Fiscal Calculation Engine
   * Strategy: 
   * 1. TVA standard (usually 19%)
   * 2. Stamp Duty (Droit de Timbre): 1% only for CASH, capped at 2,500 DA
   */
  calculateFiscalTotals(totalHt: Prisma.Decimal, totalTva: Prisma.Decimal, method: PaymentMethod) {
    let stamp = new Prisma.Decimal(0);
    
    if (method === PaymentMethod.CASH) {
      // 1% of TTC (HT + TVA)
      const baseForStamp = totalHt.add(totalTva);
      stamp = baseForStamp.mul(0.01);
      
      // Cap at 2,500 DA
      if (stamp.gt(2500)) {
        stamp = new Prisma.Decimal(2500);
      }
    }

    const totalTtc = totalHt.add(totalTva).add(stamp);
    
    return {
      totalHt,
      totalTva,
      totalStamp: stamp,
      totalTtc
    };
  }

  async createFromSalesOrder(companyId: string, salesOrderId: string, paymentMethod: PaymentMethod = PaymentMethod.CASH) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, companyId },
      include: { lines: true, invoice: true }
    });

    if (!order) throw new NotFoundException('Sales Order not found');
    if (order.status !== 'SHIPPED' && order.status !== 'INVOICED') {
      throw new BadRequestException('Order must be SHIPPED before invoicing');
    }
    if (order.invoice) {
        throw new BadRequestException('Invoice already exists for this order');
    }

    const count = await this.prisma.invoice.count({ where: { companyId } });
    const reference = `FA-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const fiscal = this.calculateFiscalTotals(
      order.totalAmountHt,
      order.totalAmountTva,
      paymentMethod
    );

    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          salesOrderId: order.id,
          customerId: order.customerId,
          reference,
          status: 'DRAFT',
          totalAmountHt: fiscal.totalHt,
          totalAmountTva: fiscal.totalTva,
          totalAmountStamp: fiscal.totalStamp,
          totalAmountTtc: fiscal.totalTtc,
          amountRemaining: fiscal.totalTtc,
          paymentMethod,
        },
        include: {
          customer: true,
          salesOrder: {
            include: {
              lines: {
                include: { product: true }
              }
            }
          }
        }
      });

      // Update Sales Order status to INVOICED
      await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'INVOICED' }
      });

      return invoice;
    });
  }


  async addPayment(companyId: string, invoiceId: string, data: any) {
    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, companyId }
      });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const paymentAmount = new Prisma.Decimal(data.amount || 0);
      if (paymentAmount.lte(0)) throw new BadRequestException('Payment amount must be greater than zero');

      await tx.payment.create({
        data: {
          companyId,
          invoiceId,
          amount: paymentAmount,
          method: data.method || 'CASH',
          reference: data.reference,
          notes: data.notes
        }
      });

      const newAmountPaid = invoice.amountPaid.add(paymentAmount);
      let newAmountRemaining = invoice.totalAmountTtc.minus(newAmountPaid);
      if (newAmountRemaining.lt(0)) newAmountRemaining = new Prisma.Decimal(0);

      let newStatus: InvoiceStatus = 'PARTIAL';
      if (newAmountRemaining.lte(0)) {
          newStatus = 'PAID';
      }

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          amountRemaining: newAmountRemaining,
          status: newStatus
        }
      });
    });
  }

  async cancel(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);
    if (invoice.status === 'PAID') {
        throw new BadRequestException('Cannot cancel a fully paid invoice');
    }

    return this.prisma.invoice.update({
        where: { id, companyId },
        data: { status: 'CANCELLED' }
    });
  }
}
