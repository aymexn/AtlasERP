"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = __importStar(require("pdfkit"));
let PdfService = class PdfService {
    async generateInvoicePdf(invoice, res) {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text(invoice.company.name, 50, 50)
            .fontSize(10)
            .text(invoice.company.address || '', 50, 75)
            .text(`NIF: ${invoice.company.nif || 'N/A'} | RC: ${invoice.company.rc || 'N/A'}`, 50, 90)
            .text(`AI: ${invoice.company.ai || 'N/A'} | Tel: ${invoice.company.phone || 'N/A'}`, 50, 105);
        doc
            .fillColor('#000000')
            .fontSize(25)
            .text('FACTURE', 200, 50, { align: 'right' })
            .fontSize(12)
            .text(`Référence: ${invoice.reference}`, 200, 80, { align: 'right' })
            .text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-DZ')}`, 200, 95, { align: 'right' });
        doc.moveDown(4);
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
        doc
            .fontSize(10)
            .text(`Réf. BC: ${invoice.salesOrder?.reference || 'N/A'}`, 350, customerTop + 15)
            .text(`Mode de Paiement: ${invoice.paymentMethod === 'CASH' ? 'Espèces' : invoice.paymentMethod}`, 350, customerTop + 30);
        const tableTop = 270;
        doc.font('Helvetica-Bold');
        this.generateTableRow(doc, tableTop, 'Désignation', 'Qté', 'P.U HT', 'TVA', 'Total TTC');
        this.generateLine(doc, tableTop + 18);
        doc.font('Helvetica');
        let currentY = tableTop + 25;
        for (const line of invoice.salesOrder?.lines || []) {
            this.generateTableRow(doc, currentY, line.product.name, Number(line.quantity).toString(), Number(line.unitPriceHt).toLocaleString('fr-DZ'), `${(Number(line.taxRate) * 100).toFixed(0)}%`, Number(line.lineTotalTtc).toLocaleString('fr-DZ'));
            currentY += 20;
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
        }
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
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5f7a');
        doc.text('NET À PAYER:', 350, totalsTop + 70);
        doc.text(formatCurrency(invoice.totalAmountTtc), 430, totalsTop + 70, { align: 'right', width: 120 });
        doc
            .fontSize(9)
            .fillColor('#aaaaaa')
            .font('Helvetica')
            .text(invoice.company.rib ? `RIB: ${invoice.company.rib}` : '', 50, 780, { align: 'center' })
            .text('AtlasERP - Solution de gestion industrielle conforme à la fiscalité algérienne', 50, 795, { align: 'center', width: 500 });
        doc.end();
    }
    generateTableRow(doc, y, item, quantity, price, tva, total) {
        doc
            .fontSize(10)
            .text(item, 50, y, { width: 220 })
            .text(quantity, 270, y, { width: 40, align: 'right' })
            .text(price, 310, y, { width: 70, align: 'right' })
            .text(tva, 390, y, { width: 40, align: 'right' })
            .text(total, 440, y, { width: 110, align: 'right' });
    }
    generateLine(doc, y) {
        doc.strokeColor('#dddddd').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map