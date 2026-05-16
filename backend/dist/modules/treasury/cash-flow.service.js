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
exports.CashFlowService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_fns_1 = require("date-fns");
const client_1 = require("@prisma/client");
let CashFlowService = class CashFlowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get30DayForecast(companyId) {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const end = (0, date_fns_1.endOfDay)((0, date_fns_1.addDays)(today, 30));
        const [totalReceived, totalSpent] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { companyId, date: { lt: today } },
                _sum: { amount: true }
            }),
            this.prisma.expense.aggregate({
                where: { companyId, date: { lt: today } },
                _sum: { amount: true }
            })
        ]);
        let runningBalance = Number(totalReceived._sum.amount || 0) - Number(totalSpent._sum.amount || 0);
        const realInflows = await this.prisma.payment.groupBy({
            by: ['date'],
            where: { companyId, date: { gte: today, lte: end } },
            _sum: { amount: true }
        });
        const pendingInvoices = await this.prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'PARTIAL'] },
                dueDate: { lte: end }
            },
            include: { customer: { select: { paymentBehavior: true } } }
        });
        const operationalExpenses = await this.prisma.expense.groupBy({
            by: ['date'],
            where: { companyId, date: { gte: today, lte: end } },
            _sum: { amount: true }
        });
        const purchaseOrders = await this.prisma.purchaseOrder.findMany({
            where: {
                companyId,
                status: { not: 'CANCELLED' },
                OR: [
                    { expectedDate: { gte: today, lte: end } },
                    { orderDate: { gte: today, lte: end }, status: client_1.PurchaseOrderStatus.FULLY_RECEIVED }
                ]
            }
        });
        const realInflowMap = new Map(realInflows.map(i => [(0, date_fns_1.format)(i.date, 'yyyy-MM-dd'), Number(i._sum.amount || 0)]));
        const expenseMap = new Map(operationalExpenses.map(e => [(0, date_fns_1.format)(e.date, 'yyyy-MM-dd'), Number(e._sum.amount || 0)]));
        const forecast = [];
        for (let i = 0; i <= 30; i++) {
            const date = (0, date_fns_1.addDays)(today, i);
            const dateStr = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
            const dailyRealInflow = realInflowMap.get(dateStr) || 0;
            const dailyForecastInflow = pendingInvoices
                .filter(inv => {
                const dueDate = inv.dueDate ? (0, date_fns_1.startOfDay)(inv.dueDate) : today;
                if (i === 0)
                    return dueDate <= today;
                return dueDate.getTime() === date.getTime();
            })
                .reduce((sum, inv) => {
                let factor = 0.85;
                if (inv.customer?.paymentBehavior === 'EXCELLENT')
                    factor = 0.98;
                if (inv.customer?.paymentBehavior === 'POOR')
                    factor = 0.50;
                return sum + (Number(inv.amountRemaining) * factor);
            }, 0);
            const inflow = dailyRealInflow + dailyForecastInflow;
            const dailyExpense = expenseMap.get(dateStr) || 0;
            const dailyPurchases = purchaseOrders
                .filter(po => {
                const targetDate = po.status === client_1.PurchaseOrderStatus.FULLY_RECEIVED ? (po.orderDate || po.createdAt) : (po.expectedDate || po.orderDate);
                return (0, date_fns_1.startOfDay)(new Date(targetDate)).getTime() === date.getTime();
            })
                .reduce((sum, po) => sum + Number(po.totalTtc), 0);
            const outflow = dailyExpense + dailyPurchases;
            const net = inflow - outflow;
            runningBalance += net;
            forecast.push({
                date: date.toISOString(),
                inflow,
                outflow,
                netPosition: net,
                projectedBalance: runningBalance
            });
        }
        return forecast;
    }
};
exports.CashFlowService = CashFlowService;
exports.CashFlowService = CashFlowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashFlowService);
//# sourceMappingURL=cash-flow.service.js.map