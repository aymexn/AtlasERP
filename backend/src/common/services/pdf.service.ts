import { Injectable, InternalServerErrorException } from '@nestjs/common';
import PDFDocument from 'pdfkit';

const MFG_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'BROUILLON',
  PLANNED: 'PLANIFIÉ',
  IN_PROGRESS: 'EN COURS',
  COMPLETED: 'TERMINÉ',
  CANCELLED: 'ANNULÉ',
};

@Injectable()
export class PdfService {

/** Safe number conversion — handles Prisma Decimal, string, number, null */
  private toNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof val === 'object' && val !== null && 'toString' in val) {
      const strVal = val.toString();
      const parsed = parseFloat(strVal);
      return isNaN(parsed) ? 0 : parsed;
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }

  /** Formats a number in Algerian style with space thousands separators */
  private formatAmount(amount: any): string {
    const value = this.toNumber(amount);
    // Use fr-DZ locale which uses spaces for thousands and comma for decimals
    return value.toLocaleString('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
  }

  /** Safe string accessor with fallback */
  private str(val: any, fallback = 'N/A'): string {
    if (val === null || val === undefined || val === '') return fallback;
    return String(val);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC ENTRY POINTS
  // ─────────────────────────────────────────────────────────────────────────

  async generateInvoicePdf(invoice: any, res: any) {
    if (!invoice) throw new InternalServerErrorException('No invoice data provided');
    
    console.log(`[PdfService.generateInvoicePdf] Generating for Reference: ${invoice.reference}`);
    
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      doc.pipe(res);

      const company = invoice.company || {};
      const companyNif = this.str(company.nif, 'N/A');
      const companyRc = this.str(company.rc, 'N/A');
      const companyAi = this.str(company.ai, 'N/A');

      this.drawOfficialHeader(doc, company, 'FACTURE');

      // ── Reference block (right side) ──
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
        .text(`RÉFÉRENCE: ${this.str(invoice.reference)}`, 350, 150, { align: 'right' });
      doc.font('Helvetica')
        .text(`DATE: ${new Date(invoice.date || invoice.createdAt || Date.now()).toLocaleDateString('fr-DZ')}`, 350, 165, { align: 'right' });

      // ── Client section ──
      const partyTop = 200;
      const customer = invoice.customer || {};
      doc.rect(50, partyTop - 5, 250, 80).fill('#F9FAFB').stroke('#E5E7EB');
      doc.fillColor('#2563eb').fontSize(9).font('Helvetica-Bold').text('CLIENT:', 60, partyTop);
      doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
        .text(this.str(customer.name, 'CLIENT GÉNÉRIQUE'), 60, partyTop + 14, { width: 225 });
      doc.fontSize(8).font('Helvetica')
        .text(this.str(customer.address, ''), 60, partyTop + 34, { width: 225 });
      if (customer.taxId) {
        doc.text(`NIF: ${customer.taxId}`, 60, partyTop + 54);
      }

      // ── Items table ──
      const lines = invoice.lines || invoice.salesOrder?.lines || [];
      const tableTop = 310;
      doc.rect(50, tableTop - 5, 500, 20).fill('#2563eb');
      doc.font('Helvetica-Bold').fillColor('#FFFFFF').fontSize(8.5);
      doc.text('Désignation', 60, tableTop);
      doc.text('Qté', 255, tableTop, { width: 40, align: 'right' });
      doc.text('Unité', 302, tableTop, { width: 35, align: 'center' });
      doc.text('Prix HT', 344, tableTop, { width: 55, align: 'right' });
      doc.text('TVA%', 402, tableTop, { width: 35, align: 'center' });
      doc.text('Montant HT', 443, tableTop, { width: 100, align: 'right' });

      doc.font('Helvetica').fillColor('#000000');
      let currentY = tableTop + 25;
      
      let computedHt = 0;
      let computedTva = 0;

      for (const line of lines) {
        const rowColor = (lines.indexOf(line) % 2 === 0) ? '#FFFFFF' : '#F9FAFB';
        doc.rect(50, currentY - 4, 500, 18).fill(rowColor);
        doc.fillColor('#000000').fontSize(8.5);

        const productName = line.product?.name || line.productName || 'N/A';
        const qty = this.toNumber(line.quantity);
        const unit = this.str(line.unit, 'u');
        const priceHt = this.toNumber(line.unitPriceHt);
        const taxRate = this.toNumber(line.taxRate || 0.19);
        const lineTotal = this.toNumber(line.lineTotalHt || qty * priceHt);
        
        computedHt += lineTotal;
        computedTva += lineTotal * taxRate;

        doc.text(productName, 60, currentY, { width: 190 });
        doc.text(String(qty), 255, currentY, { width: 40, align: 'right' });
        doc.text(unit, 302, currentY, { width: 35, align: 'center' });
        doc.text(this.formatAmount(priceHt), 344, currentY, { width: 55, align: 'right' });
        doc.text(`${Math.round(taxRate * 100)}%`, 402, currentY, { width: 35, align: 'center' });
        doc.text(this.formatAmount(lineTotal), 443, currentY, { width: 100, align: 'right' });

        this.generateLine(doc, currentY + 14, '#E5E7EB');
        currentY += 22;

        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      }

      // ── Totals block ──
      currentY += 10;
      const totalHt = this.toNumber(invoice.totalAmountHt || computedHt);
      const totalTva = this.toNumber(invoice.totalAmountTva || computedTva);
      const stamp = this.toNumber(invoice.totalAmountStamp || 0);
      const ttc = this.toNumber(invoice.totalAmountTtc || (totalHt + totalTva + stamp));

      doc.fontSize(9).font('Helvetica');
      const totalsX = 370;
      const valX = 490;
      const drawRow = (label: string, val: number, bold = false) => {
        if (bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
        doc.fillColor('#000000').text(label + ':', totalsX, currentY, { width: 110 });
        doc.text(`${this.formatAmount(val)} DA`, valX, currentY, { align: 'right', width: 60 });
        currentY += 16;
      };

      drawRow('Total HT', totalHt);
      drawRow('TVA (19%)', totalTva);
      if (stamp > 0) drawRow('Droit de Timbre', stamp);

      doc.rect(totalsX - 5, currentY - 3, 200, 24).fill('#2563eb');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
        .text('NET À PAYER:', totalsX, currentY + 3, { width: 110 })
        .text(`${this.formatAmount(ttc)} DA`, valX, currentY + 3, { align: 'right', width: 60 });
      currentY += 35;

      // ── Payment status ──
      const paid = this.toNumber(invoice.amountPaid || 0);
      const remaining = this.toNumber(invoice.amountRemaining || (ttc - paid));
      const statusMap: Record<string, string> = {
        PAID: 'SOLDÉE',
        PARTIAL: 'SOLDE PARTIEL',
        UNPAID: 'NON PAYÉE',
        DRAFT: 'NON PAYÉE',
        CANCELLED: 'ANNULÉE',
      };
      const statusLabel = statusMap[invoice.status] || 'NON PAYÉE';
      const statusColor = invoice.status === 'PAID' ? '#2563eb' : invoice.status === 'PARTIAL' ? '#f59e0b' : '#e11d48';

      doc.rect(50, currentY, 200, 26).fill(statusColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
        .text(statusLabel, 55, currentY + 7, { width: 190, align: 'center' });

      if (invoice.status === 'PARTIAL') {
        doc.fillColor('#000000').font('Helvetica').fontSize(8.5)
          .text(`Versé: ${this.formatAmount(paid)} DA`, 260, currentY + 3)
          .text(`Reste: ${this.formatAmount(remaining)} DA`, 260, currentY + 15);
      }

      this.drawFooter(doc, company);
      doc.end();
    } catch (error) {
      console.error('Invoice PDF generation failed:', error.message);
      console.error('Stack:', error.stack);
      throw new InternalServerErrorException('Error generating invoice PDF: ' + error.message);
    }
  }

  async generateSalesOrderPdf(order: any, res: any) {
    return this.generateDocument(order, res, 'BON DE COMMANDE CLIENT');
  }

  async generatePurchaseOrderPdf(order: any, res: any) {
    return this.generateDocument(order, res, 'BON DE COMMANDE FOURNISSEUR');
  }

  async generateWorkOrderPdf(order: any, res: any) {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      this.drawOfficialHeader(doc, order.company, 'ORDRE DE FABRICATION');

      const statusLabel = MFG_STATUS_LABELS[order.status] || order.status;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
        .text(`RÉFÉRENCE: ${this.str(order.reference)}`, 350, 150, { align: 'right' });
      doc.font('Helvetica')
        .text(`DATE PRÉVUE: ${new Date(order.plannedDate || Date.now()).toLocaleDateString('fr-DZ')}`, 350, 165, { align: 'right' });

      doc.moveDown(4);

      const summaryTop = 220;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb')
        .text('PRODUIT CIBLE:', 50, summaryTop)
        .fillColor('#000000').fontSize(14)
        .text(this.str(order.product?.name), 50, summaryTop + 15)
        .fontSize(10).font('Helvetica')
        .text(`Quantité à produire: ${this.formatAmount(order.plannedQuantity)} ${this.str(order.unit, '')}`, 50, summaryTop + 35)
        .text(`Formule utilisée: ${this.str(order.formula?.name)}`, 50, summaryTop + 50);

      // Status — using French labels
      const statusColor = order.status === 'COMPLETED' ? '#2563eb' : order.status === 'IN_PROGRESS' ? '#059669' : '#f59e0b';
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb')
        .text('ÉTAT ACTUEL:', 350, summaryTop)
        .fillColor(statusColor)
        .text(statusLabel, 350, summaryTop + 15)
        .fillColor('#000000').font('Helvetica')
        .text(`Créé le: ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-DZ')}`, 350, summaryTop + 35);

      const tableTop = 320;
      doc.rect(50, tableTop - 5, 500, 20).fill('#2563eb');
      doc.font('Helvetica-Bold').fillColor('#FFFFFF').fontSize(10);
      doc.text('Composant / Matière Première', 60, tableTop)
        .text('Quantité Requise', 350, tableTop, { width: 100, align: 'right' })
        .text('Unité', 460, tableTop, { width: 80, align: 'center' });

      doc.font('Helvetica').fillColor('#000000');
      let currentY = tableTop + 25;

      for (const line of (order.lines || [])) {
        doc.fontSize(10)
          .text(this.str(line.component?.name), 60, currentY, { width: 280 })
          .text(this.formatAmount(line.requiredQuantity), 350, currentY, { width: 100, align: 'right' })
          .text(this.str(line.unit, ''), 460, currentY, { width: 80, align: 'center' });

        this.generateLine(doc, currentY + 15, '#F3F4F6');
        currentY += 25;

        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      }

      this.drawFooter(doc, order.company);
      doc.end();
    } catch (error) {
      console.error('PDF Generation Error (Work Order):', error);
      throw new InternalServerErrorException('Error generating work order PDF: ' + error.message);
    }
  }

  async generateInventoryPdf(company: any, products: any[], res: any) {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      this.drawOfficialHeader(doc, company, 'ÉTAT DE STOCK');

      const tableTop = 180;
      doc.rect(50, tableTop - 5, 500, 20).fill('#2563eb');
      doc.font('Helvetica-Bold').fillColor('#FFFFFF').fontSize(9);
      doc.text('Article / SKU', 60, tableTop);
      doc.text('Famille', 280, tableTop);
      doc.text('Quantité', 380, tableTop, { width: 50, align: 'right' });
      doc.text('Unité', 440, tableTop);
      doc.text('Valorisation (DA)', 480, tableTop, { width: 60, align: 'right' });

      let currentY = tableTop + 25;
      doc.font('Helvetica').fillColor('#000000').fontSize(9);

      for (const p of products) {
        doc.text(this.str(p.name), 60, currentY, { width: 210 });
        doc.text(this.str(p.family?.name, '-'), 280, currentY);
        doc.text(this.formatAmount(p.stockQuantity), 380, currentY, { width: 50, align: 'right' });
        doc.text(this.str(p.unit, ''), 440, currentY);
        doc.text(this.formatAmount(p.stockValue || 0), 480, currentY, { width: 60, align: 'right' });

        this.generateLine(doc, currentY + 12, '#F3F4F6');
        currentY += 20;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
      }

      this.drawFooter(doc, company);
      doc.end();
    } catch (error) {
      console.error('PDF Generation Error (Inventory):', error);
      throw new InternalServerErrorException('Error generating inventory PDF: ' + error.message);
    }
  }

  async generateSupplierPdf(company: any, supplier: any, res: any) {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      this.drawOfficialHeader(doc, company, 'FICHE FOURNISSEUR');

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb').text('IDENTIFICATION DU PARTENAIRE', 50, 180);
      doc.fontSize(16).fillColor('#000000').text(this.str(supplier.name, 'N/A').toUpperCase(), 50, 200);
      doc.fontSize(10).font('Helvetica')
        .text(`Adresse: ${this.str(supplier.address)}`, 50, 225)
        .text(`Email: ${this.str(supplier.email)} | Tel: ${this.str(supplier.phone)}`, 50, 240)
        .text(`NIF: ${this.str(supplier.taxId)}`, 50, 255);

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error (Supplier):', error);
      throw new InternalServerErrorException('Error generating supplier PDF: ' + error.message);
    }
  }

  async generateExpensesPdf(company: any, expenses: any[], res: any) {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      this.drawOfficialHeader(doc, company, 'ÉTAT DES DÉPENSES');

      // Period
      if (expenses.length > 0) {
        const dates = expenses.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
        const from = dates[0].toLocaleDateString('fr-DZ');
        const to = dates[dates.length - 1].toLocaleDateString('fr-DZ');
        doc.fillColor('#666666').fontSize(8).font('Helvetica')
          .text(`Période: du ${from} au ${to}`, 50, 120);
      }

      const tableTop = 145;
      doc.rect(50, tableTop - 5, 500, 20).fill('#2563eb');
      doc.font('Helvetica-Bold').fillColor('#FFFFFF').fontSize(9);
      doc.text('Date', 60, tableTop);
      doc.text('Catégorie', 130, tableTop);
      doc.text('Libellé', 220, tableTop);
      doc.text('Règlement', 360, tableTop);
      doc.text('Montant (DA)', 450, tableTop, { width: 90, align: 'right' });

      const METHOD_LABELS: Record<string, string> = {
        CASH: 'Espèces',
        CHECK: 'Chèque',
        CHEQUE: 'Chèque',
        TRANSFER: 'Virement',
        VIREMENT: 'Virement',
        CARTE: 'Carte',
        other: 'Autre',
      };

      let currentY = tableTop + 25;
      doc.font('Helvetica').fillColor('#000000').fontSize(9);

      let total = 0;
      let lastCategory = '';

      for (const e of expenses) {
        // Category subtotal separator
        if (e.category !== lastCategory) {
          if (lastCategory !== '') {
            this.generateLine(doc, currentY, '#2563eb');
            currentY += 5;
          }
          doc.font('Helvetica-Bold').fillColor('#2563eb').fontSize(8)
            .text(this.str(e.category, 'Autre').toUpperCase(), 60, currentY);
          currentY += 14;
          doc.font('Helvetica').fillColor('#000000');
          lastCategory = e.category;
        }

        const rowColor = (expenses.indexOf(e) % 2 === 0) ? '#FFFFFF' : '#F9FAFB';
        doc.rect(50, currentY - 2, 500, 16).fill(rowColor);
        doc.fillColor('#000000').fontSize(8.5);

        const amt = this.toNumber(e.amount);
        total += amt;

        const methodLabel = METHOD_LABELS[e.paymentMethod || e.method] || this.str(e.paymentMethod || e.method, 'N/A');

        doc.text(new Date(e.date).toLocaleDateString('fr-DZ'), 60, currentY);
        doc.text(this.str(e.category, '-'), 130, currentY, { width: 85 });
        doc.text(`${this.str(e.title || e.description, '-')}${e.supplier ? ` (${e.supplier.name})` : ''}`, 220, currentY, { width: 135 });
        doc.text(methodLabel, 360, currentY, { width: 85 });
        doc.text(this.formatAmount(amt), 450, currentY, { width: 90, align: 'right' });

        this.generateLine(doc, currentY + 12, '#F3F4F6');
        currentY += 20;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
      }

      // Grand total
      currentY += 5;
      doc.rect(350, currentY + 5, 200, 28).fill('#2563eb');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
        .text('TOTAL GÉNÉRAL:', 360, currentY + 14, { width: 100 })
        .text(`${this.formatAmount(total)} DA`, 445, currentY + 14, { align: 'right', width: 95 });

      this.drawFooter(doc, company);
      doc.end();
    } catch (error) {
      console.error('Expenses PDF generation failed:', error.message);
      console.error('Stack:', error.stack);
      throw new InternalServerErrorException('Error generating expenses PDF: ' + error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private drawOfficialHeader(doc: any, company: any, title: string) {
    const headerTop = 50;
    const companyName = company?.name?.toUpperCase() || 'ATLASERP CLIENT';

    // Company name — blue, large
    doc.fillColor('#2563eb').fontSize(18).font('Helvetica-Bold')
      .text(companyName, 50, headerTop, { width: 450 });

    // Document type badge
    doc.rect(320, headerTop, 230, 36).fill('#2563eb');
    doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold')
      .text(title, 325, headerTop + 10, { width: 220, align: 'center' });

    // Legal info
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(this.str(company?.address, ''), 50, headerTop + 85, { width: 400 })
      .text(
        `NIF: ${this.str(company?.nif)} | RC: ${this.str(company?.rc)} | AI: ${this.str(company?.ai)}`,
        50, headerTop + 97
      );

    // Separator
    this.generateLine(doc, headerTop + 112, '#2563eb');
  }

  private drawFooter(doc: any, company: any) {
    const footerTop = 780;
    const companyName = company?.name?.toUpperCase() || 'ATLASERP';
    doc.strokeColor('#2563eb').lineWidth(0.5).moveTo(50, footerTop).lineTo(550, footerTop).stroke();
    doc.fontSize(7).fillColor('#aaaaaa').font('Helvetica')
      .text(
        `AtlasERP — Document de Gestion Interne — ${companyName}`,
        50, footerTop + 8, { align: 'center', width: 500 }
      );
  }

  private async generateDocument(docData: any, res: any, title: string) {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      const company = docData.company || {};
      this.drawOfficialHeader(doc, company, title);

      // Reference block
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
        .text(`REF: ${this.str(docData.reference)}`, 350, 150, { align: 'right' });
      doc.font('Helvetica')
        .text(`DATE: ${new Date(docData.date || docData.createdAt || Date.now()).toLocaleDateString('fr-DZ')}`, 350, 165, { align: 'right' });

      // Client/Supplier section
      const partyTop = 200;
      const party = docData.customer || docData.supplier || {};
      doc.rect(50, partyTop - 5, 250, 70).fill('#F9FAFB').stroke('#E5E7EB');
      doc.fillColor('#2563eb').fontSize(10).font('Helvetica-Bold')
        .text('PARTENAIRE:', 60, partyTop);
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
        .text(this.str(party.name), 60, partyTop + 15);
      doc.fontSize(9).font('Helvetica')
        .text(this.str(party.address, ''), 60, partyTop + 35, { width: 230 });

      // Lines table
      const tableTop = 300;
      doc.rect(50, tableTop - 5, 500, 20).fill('#2563eb');
      doc.font('Helvetica-Bold').fillColor('#FFFFFF').fontSize(9);
      doc.text('Désignation', 60, tableTop);
      doc.text('Quantité', 260, tableTop, { width: 60, align: 'right' });
      doc.text('Unité', 325, tableTop, { width: 40, align: 'center' });
      doc.text('P.U HT', 370, tableTop, { width: 60, align: 'right' });
      doc.text('TVA%', 435, tableTop, { width: 35, align: 'center' });
      doc.text('Total HT', 472, tableTop, { width: 70, align: 'right' });

      doc.font('Helvetica').fillColor('#000000');
      let currentY = tableTop + 25;

      const lines = docData.lines || docData.salesOrder?.lines || [];
      let computedHt = 0;

      for (const line of lines) {
        const productName = line.product?.name || line.productName || 'N/A';
        const qty = this.toNumber(line.quantity);
        const unit = this.str(line.unit, 'u');
        const priceHt = this.toNumber(line.unitPriceHt);
        const taxPct = Math.round(this.toNumber(line.taxRate || 0.19) * 100);
        const lineTotal = this.toNumber(line.lineTotalHt || qty * priceHt);
        computedHt += lineTotal;

        const rowColor = (lines.indexOf(line) % 2 === 0) ? '#FFFFFF' : '#F9FAFB';
        doc.rect(50, currentY - 3, 500, 18).fill(rowColor);
        doc.fillColor('#000000').fontSize(9);

        doc.text(productName, 60, currentY, { width: 195 });
        doc.text(String(qty), 260, currentY, { width: 60, align: 'right' });
        doc.text(unit, 325, currentY, { width: 40, align: 'center' });
        doc.text(this.formatAmount(priceHt), 370, currentY, { width: 60, align: 'right' });
        doc.text(`${taxPct}%`, 435, currentY, { width: 35, align: 'center' });
        doc.text(this.formatAmount(lineTotal), 472, currentY, { width: 70, align: 'right' });

        this.generateLine(doc, currentY + 14, '#E5E7EB');
        currentY += 22;

        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      }

      // Totals
      currentY += 10;
      const totalHt = this.toNumber(docData.totalAmountHt || docData.totalHt || computedHt);
      const totalTtc = this.toNumber(docData.totalAmountTtc || docData.totalTtc || totalHt * 1.19);
      const tvaAmt = totalTtc - totalHt;

      doc.fontSize(9).font('Helvetica');
      doc.fillColor('#555555')
        .text(`Total HT:`, 370, currentY, { width: 100 })
        .text(`${this.formatAmount(totalHt)} DA`, 470, currentY, { align: 'right', width: 70 });
      currentY += 14;
      doc.text(`TVA (19%):`, 370, currentY, { width: 100 })
        .text(`${this.formatAmount(tvaAmt)} DA`, 470, currentY, { align: 'right', width: 70 });
      currentY += 14;

      doc.rect(365, currentY, 180, 26).fill('#2563eb');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
        .text('NET À PAYER:', 370, currentY + 6, { width: 90 })
        .text(`${this.formatAmount(totalTtc)} DA`, 453, currentY + 6, { align: 'right', width: 85 });

      this.drawFooter(doc, company);
      doc.end();
    } catch (error) {
      console.error('PDF Generation Error (Document):', error);
      throw new InternalServerErrorException('Error generating PDF document: ' + error.message);
    }
  }

  private generateLine(doc: any, y: number, color = '#dddddd') {
    doc.strokeColor(color).lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
  }
}
