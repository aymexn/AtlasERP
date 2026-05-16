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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../../notifications/notifications.service");
let PayrollService = class PayrollService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createPeriod(companyId, data) {
        return this.prisma.payrollPeriod.create({
            data: {
                companyId,
                periodStart: new Date(data.periodStart),
                periodEnd: new Date(data.periodEnd),
                paymentDate: new Date(data.paymentDate),
                ...(data.periodName ? { notes: data.periodName } : {}),
            },
        });
    }
    async calculatePayroll(companyId, periodId) {
        const period = await this.prisma.payrollPeriod.findFirst({
            where: { id: periodId, companyId },
        });
        if (!period)
            throw new common_1.NotFoundException('Payroll period not found');
        if (period.locked)
            throw new common_1.BadRequestException('Period is locked');
        const employees = await this.prisma.employee.findMany({
            where: { companyId, status: 'ACTIVE' },
            include: {
                contracts: { where: { isActive: true }, take: 1 },
                salaryComponents: { include: { salaryComponent: true } },
            },
        });
        const results = [];
        for (const employee of employees) {
            const contract = employee.contracts[0];
            if (!contract)
                continue;
            let gross = Number(contract.salaryBaseAmount);
            const earnings = [];
            const deductions = [];
            for (const ec of employee.salaryComponents) {
                const comp = ec.salaryComponent;
                const amount = comp.isPercentage ? gross * (Number(ec.amount) / 100) : Number(ec.amount);
                if (comp.type === 'earning') {
                    earnings.push({ name: comp.name, amount });
                    gross += amount;
                }
                else if (comp.type === 'deduction') {
                    deductions.push({ name: comp.name, amount });
                }
            }
            const ssq = gross * 0.09;
            deductions.push({ name: 'CNAS (9%)', amount: ssq });
            const taxableIncome = gross - ssq;
            const irg = this.calculateIRG(taxableIncome);
            deductions.push({ name: 'IRG', amount: irg });
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            const net = gross - totalDeductions;
            const employerContrib = gross * 0.26;
            const employerCost = gross + employerContrib;
            const run = await this.prisma.payrollRun.upsert({
                where: { payrollPeriodId_employeeId: { payrollPeriodId: periodId, employeeId: employee.id } },
                update: {
                    grossSalary: gross,
                    totalEarnings: gross,
                    totalDeductions,
                    netSalary: net,
                    employerCost,
                    calculationDetails: { earnings, deductions, base: Number(contract.salaryBaseAmount) },
                    status: 'calculated',
                },
                create: {
                    payrollPeriod: { connect: { id: periodId } },
                    employee: { connect: { id: employee.id } },
                    grossSalary: gross,
                    totalEarnings: gross,
                    totalDeductions,
                    netSalary: net,
                    employerCost,
                    calculationDetails: { earnings, deductions, base: Number(contract.salaryBaseAmount) },
                    status: 'calculated',
                },
            });
            results.push(run);
        }
        const updatedPeriod = await this.prisma.payrollPeriod.update({
            where: { id: periodId },
            data: { status: client_1.PayrollStatus.CALCULATED },
        });
        const emails = employees.map(e => e.email).filter(Boolean);
        if (emails.length > 0) {
            this.notificationService.notifyPayrollProcessed(updatedPeriod, emails).catch(console.error);
        }
        return results;
    }
    calculateIRG(taxableIncome) {
        if (taxableIncome <= 30000)
            return 0;
        let tax = 0;
        if (taxableIncome <= 120000) {
            tax = (taxableIncome - 30000) * 0.23;
        }
        else if (taxableIncome <= 420000) {
            tax = (90000 * 0.23) + (taxableIncome - 120000) * 0.27;
        }
        else {
            tax = (90000 * 0.23) + (300000 * 0.27) + (taxableIncome - 420000) * 0.30;
        }
        let abattement = tax * 0.4;
        if (abattement < 1000)
            abattement = 1000;
        if (abattement > 2500)
            abattement = 2500;
        tax = Math.max(0, tax - abattement);
        if (taxableIncome > 30000 && taxableIncome <= 35000) {
            const reduction = tax * (10 / 3) * (1 - taxableIncome / 35000);
            tax = Math.max(0, tax - reduction);
        }
        return Math.round(tax * 100) / 100;
    }
    async getPeriods(companyId) {
        return this.prisma.payrollPeriod.findMany({
            where: { companyId },
            orderBy: { periodStart: 'desc' },
        });
    }
    async getPayrollRuns(periodId) {
        return this.prisma.payrollRun.findMany({
            where: { payrollPeriodId: periodId },
            include: { employee: true },
        });
    }
    async getPayrollRunForPdf(runId) {
        return this.prisma.payrollRun.findUnique({
            where: { id: runId },
            include: {
                employee: {
                    include: { company: true }
                },
                payrollPeriod: true
            },
        });
    }
    async getPayslips(employeeId) {
        return this.prisma.payslip.findMany({
            where: { employeeId },
            orderBy: { periodStart: 'desc' },
        });
    }
    async generatePayslip(runId) {
        const run = await this.prisma.payrollRun.findUnique({
            where: { id: runId },
            include: { employee: true, payrollPeriod: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Payroll run not found');
        const filePath = `/uploads/payslips/payslip_${run.id}.pdf`;
        return this.prisma.payslip.upsert({
            where: { payrollRunId: run.id },
            update: {
                filePath,
                generatedAt: new Date(),
            },
            create: {
                payrollRunId: run.id,
                employeeId: run.employeeId,
                periodStart: run.payrollPeriod.periodStart,
                periodEnd: run.payrollPeriod.periodEnd,
                filePath,
            },
        });
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map