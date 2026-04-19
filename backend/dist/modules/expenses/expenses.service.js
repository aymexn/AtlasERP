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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ExpensesService = class ExpensesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        console.log(`[ExpensesService.findAll] Fetching for companyId: ${companyId}`);
        return this.prisma.expense.findMany({
            where: { companyId },
            include: { supplier: true },
            orderBy: { date: 'desc' },
        });
    }
    async findOne(companyId, id) {
        const expense = await this.prisma.expense.findFirst({
            where: { id, companyId },
            include: { supplier: true },
        });
        if (!expense)
            throw new common_1.NotFoundException('Expense not found');
        return expense;
    }
    async create(companyId, data) {
        console.log(`[ExpensesService.create] Called for companyId: ${companyId}`);
        try {
            const { supplierId, amount, ...rest } = data;
            return await this.prisma.expense.create({
                data: {
                    ...rest,
                    companyId,
                    amount: Number(amount) || 0,
                    date: data.date ? new Date(data.date) : new Date(),
                    supplierId: supplierId || null,
                    paymentMethod: data.paymentMethod || client_1.PaymentMethod.CASH,
                },
            });
        }
        catch (error) {
            console.error('ExpensesService.create Error:', error);
            throw error;
        }
    }
    async update(companyId, id, data) {
        await this.findOne(companyId, id);
        const { supplierId, ...rest } = data;
        return this.prisma.expense.update({
            where: { id },
            data: {
                ...rest,
                date: data.date ? new Date(data.date) : undefined,
                supplierId: supplierId !== undefined ? (supplierId || null) : undefined,
            },
        });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        return this.prisma.expense.delete({ where: { id } });
    }
    async getStats(companyId) {
        const expenses = await this.prisma.expense.groupBy({
            by: ['category'],
            where: { companyId },
            _sum: { amount: true }
        });
        return expenses.map(e => ({
            category: e.category,
            total: Number(e._sum.amount || 0)
        }));
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map