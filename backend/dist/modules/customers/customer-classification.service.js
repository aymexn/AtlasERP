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
exports.CustomerClassificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CustomerClassificationService = class CustomerClassificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recalculateCustomerStats(companyId, customerId) {
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
        const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.totalAmountHt || 0), 0);
        let segment;
        if (totalRevenue >= 5_000_000) {
            segment = client_1.CustomerSegment.A;
        }
        else if (totalRevenue >= 1_500_000) {
            segment = client_1.CustomerSegment.B;
        }
        else {
            segment = client_1.CustomerSegment.C;
        }
        const paymentDelays = [];
        for (const invoice of invoices) {
            if (invoice.payments.length > 0) {
                const invoiceDate = new Date(invoice.date).getTime();
                const firstPaymentDate = new Date(invoice.payments[0].date).getTime();
                const delayDays = Math.round((firstPaymentDate - invoiceDate) / (1000 * 60 * 60 * 24));
                if (delayDays >= 0) {
                    paymentDelays.push(delayDays);
                }
            }
        }
        const avgPaymentDelay = paymentDelays.length > 0
            ? Math.round(paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length)
            : 0;
        let paymentBehavior;
        if (avgPaymentDelay === 0 && paymentDelays.length === 0) {
            paymentBehavior = client_1.PaymentBehavior.GOOD;
        }
        else if (avgPaymentDelay <= 15) {
            paymentBehavior = client_1.PaymentBehavior.EXCELLENT;
        }
        else if (avgPaymentDelay <= 30) {
            paymentBehavior = client_1.PaymentBehavior.GOOD;
        }
        else if (avgPaymentDelay <= 60) {
            paymentBehavior = client_1.PaymentBehavior.AVERAGE;
        }
        else {
            paymentBehavior = client_1.PaymentBehavior.POOR;
        }
        const outstandingBalance = invoices.reduce((acc, inv) => acc + Number(inv.amountRemaining || 0), 0);
        let riskLevel;
        const outstandingRatio = totalRevenue > 0 ? outstandingBalance / totalRevenue : 0;
        if (paymentBehavior === client_1.PaymentBehavior.POOR || outstandingRatio > 0.6) {
            riskLevel = client_1.RiskLevel.HIGH;
        }
        else if (paymentBehavior === client_1.PaymentBehavior.AVERAGE ||
            outstandingRatio > 0.3) {
            riskLevel = client_1.RiskLevel.MEDIUM;
        }
        else {
            riskLevel = client_1.RiskLevel.LOW;
        }
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
    async recalculateAllCustomers(companyId) {
        const customers = await this.prisma.customer.findMany({
            where: { companyId, isActive: true },
            select: { id: true },
        });
        for (const customer of customers) {
            await this.recalculateCustomerStats(companyId, customer.id);
        }
    }
};
exports.CustomerClassificationService = CustomerClassificationService;
exports.CustomerClassificationService = CustomerClassificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerClassificationService);
//# sourceMappingURL=customer-classification.service.js.map