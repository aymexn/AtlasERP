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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const PDFDocument = __importStar(require("pdfkit"));
let InvoicesService = class InvoicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        return this.prisma.invoice.findMany({
            where: { companyId },
            include: { customer: { select: { name: true } }, salesOrder: { select: { reference: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(companyId, id) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, companyId },
            include: {
                customer: true,
                company: true,
                salesOrder: { include: { lines: { include: { product: true } } } },
                payments: true
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return invoice;
    }
    calculateFiscalTotals(totalHt, totalTva, method) {
        let stamp = new client_1.Prisma.Decimal(0);
        if (method === client_1.PaymentMethod.CASH) {
            const baseForStamp = totalHt.add(totalTva);
            stamp = baseForStamp.mul(0.01);
            if (stamp.gt(2500)) {
                stamp = new client_1.Prisma.Decimal(2500);
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
    async createFromSalesOrder(companyId, salesOrderId, paymentMethod = client_1.PaymentMethod.CASH) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id: salesOrderId, companyId },
            include: { lines: true, invoice: true }
        });
        if (!order)
            throw new common_1.NotFoundException('Sales Order not found');
        if (order.status !== 'SHIPPED' && order.status !== 'INVOICED') {
            throw new common_1.BadRequestException('Order must be SHIPPED before invoicing');
        }
        if (order.invoice) {
            throw new common_1.BadRequestException('Invoice already exists for this order');
        }
        const count = await this.prisma.invoice.count({ where: { companyId } });
        const reference = `FA-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        const fiscal = this.calculateFiscalTotals(order.totalAmountHt, order.totalAmountTva, paymentMethod);
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
            await tx.salesOrder.update({
                where: { id: order.id },
                data: { status: 'INVOICED' }
            });
            return invoice;
        });
    }
    async generatePdf(companyId, id) {
        const invoice = await this.findOne(companyId, id);
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            doc.fillColor('#444444').fontSize(20).text(invoice.company.name, { align: 'left' });
            doc.fontSize(10).text(invoice.company.address || '', { align: 'left' });
            doc.text(`NIF: ${invoice.company.nif || 'N/A'} | RC: ${invoice.company.rc || 'N/A'}`, { align: 'left' });
            doc.text(`AI: ${invoice.company.ai || 'N/A'} | Tel: ${invoice.company.phone || 'N/A'}`, { align: 'left' });
            doc.moveDown();
            doc.fillColor('#000000').fontSize(25).text('FACTURE', { align: 'right' });
            doc.fontSize(12).text(`Référence: ${invoice.reference}`, { align: 'right' });
            doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-DZ')}`, { align: 'right' });
            doc.moveDown(2);
            doc.fontSize(12).text('Facturé à:', { underline: true });
            doc.fontSize(14).text(invoice.customer.name);
            doc.fontSize(10).text(invoice.customer.address || '');
            doc.text(`NIF: ${invoice.customer.taxId || 'N/A'}`);
            doc.moveDown(2);
            const tableTop = 270;
            doc.font('Helvetica-Bold');
            doc.text('Désignation', 50, tableTop);
            doc.text('Qté', 280, tableTop, { width: 50, align: 'right' });
            doc.text('P.U HT', 330, tableTop, { width: 70, align: 'right' });
            doc.text('TVA', 410, tableTop, { width: 40, align: 'right' });
            doc.text('Total TTC', 460, tableTop, { width: 90, align: 'right' });
            doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            let y = tableTop + 25;
            doc.font('Helvetica');
            invoice.salesOrder?.lines.forEach(line => {
                doc.text(line.product.name, 50, y, { width: 220 });
                doc.text(Number(line.quantity).toString(), 280, y, { width: 50, align: 'right' });
                doc.text(Number(line.unitPriceHt).toLocaleString('fr-DZ'), 330, y, { width: 70, align: 'right' });
                doc.text(`${(Number(line.taxRate) * 100).toFixed(0)}%`, 410, y, { width: 40, align: 'right' });
                doc.text(Number(line.lineTotalTtc).toLocaleString('fr-DZ'), 460, y, { width: 90, align: 'right' });
                y += 20;
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });
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
            doc.fontSize(9).font('Helvetica').fillColor('#777777');
            if (invoice.company.rib) {
                doc.text(`RIB: ${invoice.company.rib}`, 50, 780, { align: 'center' });
            }
            doc.text('AtlasERP - Solution de gestion industrielle', 50, 795, { align: 'center' });
            doc.end();
        });
    }
    async cancel(companyId, id) {
        const invoice = await this.findOne(companyId, id);
        if (invoice.status === 'PAID') {
            throw new common_1.BadRequestException('Cannot cancel a fully paid invoice');
        }
        return this.prisma.invoice.update({
            where: { id, companyId },
            data: { status: 'CANCELLED' }
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map