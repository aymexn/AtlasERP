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
      include: { customer: { select: { name: true } }, salesOrder: { select: { reference: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: { 
        customer: true,
        company: true,
        salesOrder: { include: { lines: { include: { product: true } } } },
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

  async generatePdf(companyId: string, id: string): Promise<Buffer> {
    const invoice = await this.findOne(companyId, id);

    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Header: Company Info ---
      doc.fillColor('#444444').fontSize(20).text(invoice.company.name, { align: 'left' });
      doc.fontSize(10).text(invoice.company.address || '', { align: 'left' });
      doc.text(`NIF: ${invoice.company.nif || 'N/A'} | RC: ${invoice.company.rc || 'N/A'}`, { align: 'left' });
      doc.text(`AI: ${invoice.company.ai || 'N/A'} | Tel: ${invoice.company.phone || 'N/A'}`, { align: 'left' });

      doc.moveDown();
      doc.fillColor('#000000').fontSize(25).text('FACTURE', { align: 'right' });
      doc.fontSize(12).text(`Référence: ${invoice.reference}`, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-DZ')}`, { align: 'right' });

      doc.moveDown(2);

      // --- Customer Info ---
      doc.fontSize(12).text('Facturé à:', { underline: true });
      doc.fontSize(14).text(invoice.customer.name);
      doc.fontSize(10).text(invoice.customer.address || '');
      doc.text(`NIF: ${invoice.customer.taxId || 'N/A'}`);

      doc.moveDown(2);

      // --- Table Header ---
      const tableTop = 270;
      doc.font('Helvetica-Bold');
      doc.text('Désignation', 50, tableTop);
      doc.text('Qté', 280, tableTop, { width: 50, align: 'right' });
      doc.text('P.U HT', 330, tableTop, { width: 70, align: 'right' });
      doc.text('TVA', 410, tableTop, { width: 40, align: 'right' });
      doc.text('Total TTC', 460, tableTop, { width: 90, align: 'right' });
      
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // --- Table Body ---
      let y = tableTop + 25;
      doc.font('Helvetica');
      invoice.salesOrder?.lines.forEach(line => {
        doc.text(line.product.name, 50, y, { width: 220 });
        doc.text(Number(line.quantity).toString(), 280, y, { width: 50, align: 'right' });
        doc.text(Number(line.unitPriceHt).toLocaleString('fr-DZ'), 330, y, { width: 70, align: 'right' });
        doc.text(`${(Number(line.taxRate) * 100).toFixed(0)}%`, 410, y, { width: 40, align: 'right' });
        doc.text(Number(line.lineTotalTtc).toLocaleString('fr-DZ'), 460, y, { width: 90, align: 'right' });
        y += 20;

        // Check for page break if y gets too high
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
      });

      // --- Totals Section ---
      const totalsTop = Math.min(y + 30, 750);
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(350, totalsTop).lineTo(550, totalsTop).stroke();
      
      const formatCurrency = (val) => `${Number(val).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA`;

      y = totalsTop + 10;
      doc.fontSize(10).text('Total HT:', 350, y);
      doc.text(formatCurrency(invoice.totalAmountHt), 450, y, { align: 'right' });
      
      y += 15;
      doc.text('Total TVA:', 350, y);
      doc.text(formatCurrency(invoice.totalAmountTva), 450, y, { align: 'right' });

      if (Number(invoice.totalAmountStamp) > 0) {
        y += 15;
        doc.text('Droit de Timbre (1%):', 350, y);
        doc.text(formatCurrency(invoice.totalAmountStamp), 450, y, { align: 'right' });
      }

      y += 20;
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('NET À PAYER:', 350, y);
      doc.text(formatCurrency(invoice.totalAmountTtc), 450, y, { align: 'right' });

      // --- Footer ---
      doc.fontSize(9).font('Helvetica').fillColor('#777777');
      if (invoice.company.rib) {
          doc.text(`RIB: ${invoice.company.rib}`, 50, 780, { align: 'center' });
      }
      doc.text('AtlasERP - Solution de gestion industrielle', 50, 795, { align: 'center' });

      doc.end();
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
