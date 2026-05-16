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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
let PaymentsService = class PaymentsService {
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async findAll(companyId) {
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
    async recordPayment(companyId, data) {
        const { invoiceId, amount, method, date, reference, notes } = data;
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId }
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        if (invoice.status === 'PAID')
            throw new common_1.BadRequestException('Invoice is already fully paid');
        const paymentAmount = new client_1.Prisma.Decimal(amount);
        if (paymentAmount.gt(invoice.amountRemaining)) {
            throw new common_1.BadRequestException(`Payment amount exceeds remaining balance (${invoice.amountRemaining} DA)`);
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    companyId,
                    invoiceId,
                    amount: paymentAmount,
                    method: method || client_1.PaymentMethod.CASH,
                    date: date ? new Date(date) : new Date(),
                    reference,
                    notes,
                },
            });
            const newAmountPaid = invoice.amountPaid.add(paymentAmount);
            const newAmountRemaining = invoice.amountRemaining.minus(paymentAmount);
            let newStatus = invoice.status;
            if (newAmountRemaining.isZero()) {
                newStatus = 'PAID';
            }
            else if (newAmountPaid.gt(0)) {
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map