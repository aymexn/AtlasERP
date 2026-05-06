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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId, filters = {}) {
        const where = { companyId };
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        else
            where.isActive = true;
        if (filters.segment)
            where.segment = filters.segment;
        if (filters.customerType)
            where.customerType = filters.customerType;
        if (filters.paymentBehavior)
            where.paymentBehavior = filters.paymentBehavior;
        if (filters.riskLevel)
            where.riskLevel = filters.riskLevel;
        const customers = await this.prisma.customer.findMany({
            where,
            include: {
                invoices: {
                    where: { status: { not: 'CANCELLED' } },
                    select: { totalAmountHt: true },
                },
            },
        });
        return customers
            .map((c) => {
            const dynamicRevenue = c.invoices.reduce((acc, inv) => acc + Number(inv.totalAmountHt || 0), 0);
            return {
                ...c,
                totalRevenue: dynamicRevenue,
                invoices: undefined,
            };
        })
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
    async findOne(companyId, id) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, companyId },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async create(companyId, data) {
        return this.prisma.customer.create({
            data: {
                ...data,
                companyId,
            },
        });
    }
    async update(companyId, id, data) {
        await this.findOne(companyId, id);
        return this.prisma.customer.update({
            where: { id },
            data,
        });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        return this.prisma.customer.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getPerformanceData(companyId, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, companyId },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const [yearInvoices, allTimeStats, openOrders, unpaidInvoices,] = await Promise.all([
            this.prisma.invoice.findMany({
                where: {
                    customerId,
                    companyId,
                    status: { not: 'CANCELLED' },
                    date: { gte: startOfYear },
                },
            }),
            this.prisma.invoice.aggregate({
                where: {
                    customerId,
                    companyId,
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmountHt: true },
            }),
            this.prisma.salesOrder.findMany({
                where: {
                    customerId,
                    companyId,
                    status: { notIn: ['INVOICED', 'CANCELLED'] },
                },
                orderBy: { date: 'desc' },
                take: 10,
            }),
            this.prisma.invoice.findMany({
                where: {
                    customerId,
                    companyId,
                    status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
                },
                orderBy: { date: 'desc' },
                take: 10,
            }),
        ]);
        const monthlyRevenue = await this.prisma.invoice.groupBy({
            by: ['date'],
            where: {
                customerId,
                companyId,
                status: { not: 'CANCELLED' },
                date: { gte: twelveMonthsAgo },
            },
            _sum: { totalAmountHt: true },
        });
        const trend = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleDateString('fr-FR', {
                month: 'short',
                year: '2-digit',
            });
            const monthRevenue = monthlyRevenue
                .filter((r) => {
                const rDate = new Date(r.date);
                return (rDate.getFullYear() === d.getFullYear() &&
                    rDate.getMonth() === d.getMonth());
            })
                .reduce((acc, r) => acc + Number(r._sum.totalAmountHt || 0), 0);
            trend.push({ month: monthLabel, revenue: monthRevenue });
        }
        const salesLines = await this.prisma.salesOrderLine.findMany({
            where: {
                salesOrder: { customerId, companyId },
            },
            include: { product: { select: { name: true, sku: true } } },
        });
        const productMap = new Map();
        for (const line of salesLines) {
            const existing = productMap.get(line.productId) || {
                name: line.product.name,
                sku: line.product.sku,
                qty: 0,
                revenue: 0,
            };
            existing.qty += Number(line.quantity);
            existing.revenue += Number(line.lineTotalHt);
            productMap.set(line.productId, existing);
        }
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        const totalRevenueAllTime = Number(allTimeStats._sum.totalAmountHt || 0);
        const totalRevenueThisYear = yearInvoices.reduce((acc, inv) => acc + Number(inv.totalAmountHt || 0), 0);
        const outstandingBalance = unpaidInvoices.reduce((acc, inv) => acc + Number(inv.amountRemaining || 0), 0);
        return {
            customer: {
                ...customer,
                totalRevenue: totalRevenueAllTime,
            },
            kpis: {
                totalRevenueAllTime,
                totalRevenueThisYear,
                outstandingBalance,
                avgPaymentDelay: customer.avgPaymentDelay,
                segment: customer.segment,
                paymentBehavior: customer.paymentBehavior,
                riskLevel: customer.riskLevel,
            },
            trend,
            topProducts,
            openOrders: openOrders.map((o) => ({
                id: o.id,
                reference: o.reference,
                status: o.status,
                date: o.date,
                totalAmountTtc: Number(o.totalAmountTtc),
            })),
            unpaidInvoices: unpaidInvoices.map((inv) => ({
                id: inv.id,
                reference: inv.reference,
                date: inv.date,
                totalAmountTtc: Number(inv.totalAmountTtc),
                amountRemaining: Number(inv.amountRemaining),
                status: inv.status,
            })),
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map