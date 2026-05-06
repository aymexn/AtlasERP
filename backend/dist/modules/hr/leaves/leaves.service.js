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
exports.LeavesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let LeavesService = class LeavesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLeaveTypes(companyId) {
        return this.prisma.leaveType.findMany({
            where: { companyId, isActive: true },
        });
    }
    async createLeaveType(companyId, data) {
        return this.prisma.leaveType.create({
            data: {
                ...data,
                companyId,
            },
        });
    }
    async getBalances(employeeId, year = new Date().getFullYear()) {
        return this.prisma.leaveBalance.findMany({
            where: { employeeId, periodYear: year },
            include: { leaveType: true },
        });
    }
    async requestLeave(companyId, employeeId, data) {
        const { leaveTypeId, startDate, endDate, reason, documentId } = data;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end)
            throw new common_1.BadRequestException('Start date must be before end date');
        const totalDays = await this.calculateWorkingDays(companyId, start, end);
        const leaveType = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType)
            throw new common_1.NotFoundException('Leave type not found');
        if (leaveType.isPaid) {
            const balance = await this.prisma.leaveBalance.findFirst({
                where: { employeeId, leaveTypeId, periodYear: start.getFullYear() },
            });
            if (!balance)
                throw new common_1.BadRequestException('No leave balance found for this period');
            const available = Number(balance.totalEntitled || 0) - Number(balance.usedDays) - Number(balance.pendingDays);
            if (available < totalDays) {
                throw new common_1.BadRequestException(`Insufficient balance. Available: ${available} days, Requested: ${totalDays} days`);
            }
            await this.prisma.leaveBalance.update({
                where: { id: balance.id },
                data: { pendingDays: { increment: totalDays } },
            });
        }
        return this.prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveTypeId,
                startDate: start,
                endDate: end,
                totalDays,
                reason,
                documentId,
                status: client_1.LeaveStatus.PENDING,
            },
        });
    }
    async findAll(companyId, filters = {}) {
        const where = { employee: { companyId } };
        if (filters.status)
            where.status = filters.status;
        if (filters.employeeId)
            where.employeeId = filters.employeeId;
        return this.prisma.leaveRequest.findMany({
            where,
            include: {
                employee: true,
                leaveType: true,
            },
            orderBy: { appliedAt: 'desc' },
        });
    }
    async approveByManager(companyId, requestId, managerId, comment) {
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: { employee: true },
        });
        if (!request || request.employee.companyId !== companyId) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        return this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.LeaveStatus.APPROVED_BY_MANAGER,
                approvedByManager: managerId,
                managerComment: comment,
            },
        });
    }
    async approveByHr(companyId, requestId, hrId, comment) {
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: { employee: true, leaveType: true },
        });
        if (!request || request.employee.companyId !== companyId) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.LeaveStatus.APPROVED,
                    approvedByHr: hrId,
                    hrComment: comment,
                },
            });
            if (request.leaveType.isPaid) {
                const balance = await tx.leaveBalance.findFirst({
                    where: {
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                        periodYear: request.startDate.getFullYear()
                    },
                });
                if (balance) {
                    await tx.leaveBalance.update({
                        where: { id: balance.id },
                        data: {
                            pendingDays: { decrement: request.totalDays },
                            usedDays: { increment: request.totalDays },
                        },
                    });
                }
            }
            return updatedRequest;
        });
    }
    async reject(companyId, requestId, rejectedBy, comment) {
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: { employee: true, leaveType: true },
        });
        if (!request || request.employee.companyId !== companyId) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.LeaveStatus.REJECTED,
                    hrComment: comment,
                },
            });
            if (request.leaveType.isPaid) {
                const balance = await tx.leaveBalance.findFirst({
                    where: {
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                        periodYear: request.startDate.getFullYear()
                    },
                });
                if (balance) {
                    await tx.leaveBalance.update({
                        where: { id: balance.id },
                        data: {
                            pendingDays: { decrement: request.totalDays },
                        },
                    });
                }
            }
            return updatedRequest;
        });
    }
    async getCalendar(companyId, start, end) {
        return this.prisma.leaveRequest.findMany({
            where: {
                employee: { companyId },
                status: { in: [client_1.LeaveStatus.APPROVED, client_1.LeaveStatus.APPROVED_BY_MANAGER] },
                OR: [
                    { startDate: { gte: start, lte: end } },
                    { endDate: { gte: start, lte: end } },
                ],
            },
            include: {
                employee: { select: { firstName: true, lastName: true } },
                leaveType: { select: { name: true, color: true } },
            },
        });
    }
    async calculateWorkingDays(companyId, start, end) {
        let count = 0;
        const curDate = new Date(start.getTime());
        const holidays = await this.prisma.publicHoliday.findMany({
            where: {
                OR: [
                    { companyId },
                    { companyId: null },
                ],
                date: { gte: start, lte: end },
            },
        });
        const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);
        while (curDate <= end) {
            const dayOfWeek = curDate.getDay();
            const dateStr = curDate.toISOString().split('T')[0];
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidayDates.includes(dateStr);
            if (!isWeekend && !isHoliday) {
                count++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    }
};
exports.LeavesService = LeavesService;
exports.LeavesService = LeavesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeavesService);
//# sourceMappingURL=leaves.service.js.map