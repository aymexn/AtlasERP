import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  /**
   * Generates a professional localized invoice PDF
   */
  async generateInvoicePdf(invoice: any, res: any) {
    const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });

    doc.pipe(res);

    // --- Header: Company Info ---
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text(invoice.company.name, 50, 50)
      .fontSize(10)
      .text(invoice.company.address || '', 50, 75)
      .text(`NIF: ${invoice.company.nif || 'N/A'} | RC: ${invoice.company.rc || 'N/A'}`, 50, 90)
      .text(`AI: ${invoice.company.ai || 'N/A'} | Tel: ${invoice.company.phone || 'N/A'}`, 50, 105);

    // --- Date & Ref (Top Right) ---
    doc
        .fillColor('#000000')
        .fontSize(25)
        .text('FACTURE', 200, 50, { align: 'right' })
        .fontSize(12)
        .text(`Référence: ${invoice.reference}`, 200, 80, { align: 'right' })
        .text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-DZ')}`, 200, 95, { align: 'right' });

    doc.moveDown(4);

    // --- Customer Details ---
    const customerTop = 160;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('FACTURÉ À:', 50, customerTop)
      .fontSize(14)
      .text(invoice.customer.name, 50, customerTop + 15)
      .font('Helvetica')
      .fontSize(10)
      .text(invoice.customer.address || '', 50, customerTop + 35)
      .text(`NIF: ${invoice.customer.taxId || 'N/A'}`, 50, customerTop + 50);

    // --- Sales Info ---
    doc
      .fontSize(10)
      .text(`Réf. BC: ${invoice.salesOrder?.reference || 'N/A'}`, 350, customerTop + 15)
      .text(`Mode de Paiement: ${invoice.paymentMethod === 'CASH' ? 'Espèces' : invoice.paymentMethod}`, 350, customerTop + 30);

    // --- Table Header ---
    const tableTop = 270;
    doc.font('Helvetica-Bold');
    this.generateTableRow(doc, tableTop, 'Désignation', 'Qté', 'P.U HT', 'TVA', 'Total TTC');
    this.generateLine(doc, tableTop + 18);

    // --- Table Rows ---
    doc.font('Helvetica');
    let currentY = tableTop + 25;

    for (const line of invoice.salesOrder?.lines || []) {
      this.generateTableRow(
        doc,
        currentY,
        line.product.name,
        Number(line.quantity).toString(),
        Number(line.unitPriceHt).toLocaleString('fr-DZ'),
        `${(Number(line.taxRate) * 100).toFixed(0)}%`,
        Number(line.lineTotalTtc).toLocaleString('fr-DZ')
      );
      currentY += 20;

      if (currentY > 700) {
          doc.addPage();
          currentY = 50;
      }
    }

    // --- Totals Section ---
    const totalsTop = Math.min(currentY + 40, 750);
    this.generateLine(doc, totalsTop - 10);
    
    const formatCurrency = (val) => `${Number(val).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA`;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('TOTAL H.T:', 350, totalsTop);
    doc.text(formatCurrency(invoice.totalAmountHt), 450, totalsTop, { align: 'right' });

    doc.font('Helvetica').text('TOTAL TVA (19%):', 350, totalsTop + 20);
    doc.text(formatCurrency(invoice.totalAmountTva), 450, totalsTop + 20, { align: 'right' });

    if (Number(invoice.totalAmountStamp) > 0) {
      doc.text('DROIT DE TIMBRE:', 350, totalsTop + 40);
      doc.text(formatCurrency(invoice.totalAmountStamp), 450, totalsTop + 40, { align: 'right' });
    }

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5f7a'); // Industrial blue
    doc.text('NET À PAYER:', 350, totalsTop + 70);
    doc.text(formatCurrency(invoice.totalAmountTtc), 430, totalsTop + 70, { align: 'right', width: 120 });

    // --- Footer ---
    doc
      .fontSize(9)
      .fillColor('#aaaaaa')
      .font('Helvetica')
      .text(invoice.company.rib ? `RIB: ${invoice.company.rib}` : '', 50, 780, { align: 'center' })
      .text('AtlasERP - Solution de gestion industrielle conforme à la fiscalité algérienne', 50, 795, { align: 'center', width: 500 });

    doc.end();
  }

  private generateTableRow(doc: any, y: number, item: string, quantity: string, price: string, tva: string, total: string) {
    doc
      .fontSize(10)
      .text(item, 50, y, { width: 220 })
      .text(quantity, 270, y, { width: 40, align: 'right' })
      .text(price, 310, y, { width: 70, align: 'right' })
      .text(tva, 390, y, { width: 40, align: 'right' })
      .text(total, 440, y, { width: 110, align: 'right' });
  }

  private generateLine(doc: any, y: number) {
    doc.strokeColor('#dddddd').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  }
}
