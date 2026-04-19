"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let InvoicesService = class InvoicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
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
    async findOne(companyId, id) {
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
            await tx.salesOrder.update({
                where: { id: order.id },
                data: { status: 'INVOICED' }
            });
            return invoice;
        });
    }
    async addPayment(companyId, invoiceId, data) {
        return await this.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findFirst({
                where: { id: invoiceId, companyId }
            });
            if (!invoice)
                throw new common_1.NotFoundException('Invoice not found');
            const paymentAmount = new client_1.Prisma.Decimal(data.amount || 0);
            if (paymentAmount.lte(0))
                throw new common_1.BadRequestException('Payment amount must be greater than zero');
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
            if (newAmountRemaining.lt(0))
                newAmountRemaining = new client_1.Prisma.Decimal(0);
            let newStatus = 'PARTIAL';
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