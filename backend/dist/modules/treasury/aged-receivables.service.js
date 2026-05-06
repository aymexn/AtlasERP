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
exports.AgedReceivablesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AgedReceivablesService = class AgedReceivablesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAgedReceivables(companyId) {
        const today = new Date();
        const invoices = await this.prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'PARTIAL'] },
            },
            include: {
                customer: true,
            },
        });
        const summary = {
            totalOutstanding: 0,
            current: 0,
            late30: 0,
            late60: 0,
            late90: 0,
        };
        const customerMap = new Map();
        invoices.forEach((invoice) => {
            const amount = Number(invoice.amountRemaining);
            const dueDate = invoice.dueDate || invoice.date;
            const daysDiff = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
            summary.totalOutstanding += amount;
            let bucket = 'current';
            if (daysDiff > 90) {
                summary.late90 += amount;
                bucket = 'late90';
            }
            else if (daysDiff > 60) {
                summary.late60 += amount;
                bucket = 'late60';
            }
            else if (daysDiff > 30) {
                summary.late30 += amount;
                bucket = 'late30';
            }
            else {
                summary.current += amount;
                bucket = 'current';
            }
            const custId = invoice.customerId;
            if (!customerMap.has(custId)) {
                customerMap.set(custId, {
                    id: custId,
                    name: invoice.customer.name,
                    totalOutstanding: 0,
                    current: 0,
                    late30: 0,
                    late60: 0,
                    late90: 0,
                    paymentBehavior: invoice.customer.paymentBehavior,
                    avgPaymentDelay: invoice.customer.avgPaymentDelay,
                });
            }
            const custData = customerMap.get(custId);
            custData.totalOutstanding += amount;
            custData[bucket] += amount;
        });
        return {
            summary,
            customers: Array.from(customerMap.values()),
        };
    }
    async getCustomerAging(companyId, customerId) {
        const today = new Date();
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                invoices: {
                    where: {
                        status: { in: ['SENT', 'PARTIAL'] },
                    },
                    orderBy: { date: 'desc' },
                },
            },
        });
        if (!customer)
            throw new Error('Customer not found');
        const buckets = {
            current: [],
            late30: [],
            late60: [],
            late90: [],
        };
        customer.invoices.forEach((inv) => {
            const dueDate = inv.dueDate || inv.date;
            const daysDiff = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
            const invoiceData = {
                ...inv,
                daysOverdue: Math.max(0, daysDiff),
            };
            if (daysDiff > 90)
                buckets.late90.push(invoiceData);
            else if (daysDiff > 60)
                buckets.late60.push(invoiceData);
            else if (daysDiff > 30)
                buckets.late30.push(invoiceData);
            else
                buckets.current.push(invoiceData);
        });
        return {
            customer: {
                id: customer.id,
                name: customer.name,
                totalRevenue: customer.totalRevenue,
                paymentBehavior: customer.paymentBehavior,
            },
            buckets,
        };
    }
};
exports.AgedReceivablesService = AgedReceivablesService;
exports.AgedReceivablesService = AgedReceivablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgedReceivablesService);
//# sourceMappingURL=aged-receivables.service.js.map