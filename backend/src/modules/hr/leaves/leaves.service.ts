import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async getLeaveTypes(companyId: string) {
    return this.prisma.leaveType.findMany({
      where: { companyId, isActive: true },
    });
  }

  async createLeaveType(companyId: string, data: any) {
    return this.prisma.leaveType.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getBalances(employeeId: string, year: number = new Date().getFullYear()) {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, periodYear: year },
      include: { leaveType: true },
    });
  }

  async requestLeave(companyId: string, employeeId: string, data: any) {
    const { leaveTypeId, startDate, endDate, reason, documentId } = data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) throw new BadRequestException('Start date must be before end date');

    // Calculate total working days
    const totalDays = await this.calculateWorkingDays(companyId, start, end);

    // Check balance if it's a paid leave
    const leaveType = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    if (leaveType.isPaid) {
      const balance = await this.prisma.leaveBalance.findFirst({
        where: { employeeId, leaveTypeId, periodYear: start.getFullYear() },
      });

      if (!balance) throw new BadRequestException('No leave balance found for this period');

      const available = Number(balance.totalEntitled || 0) - Number(balance.usedDays) - Number(balance.pendingDays);
      if (available < totalDays) {
        throw new BadRequestException(`Insufficient balance. Available: ${available} days, Requested: ${totalDays} days`);
      }

      // Update pending days
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
        status: LeaveStatus.PENDING,
      },
    });
  }

  async findAll(companyId: string, filters: any = {}) {
    const where: any = { employee: { companyId } };

    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async approveByManager(companyId: string, requestId: string, managerId: string, comment?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request || request.employee.companyId !== companyId) {
      throw new NotFoundException('Leave request not found');
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.APPROVED_BY_MANAGER,
        approvedByManager: managerId,
        managerComment: comment,
      },
    });
  }

  async approveByHr(companyId: string, requestId: string, hrId: string, comment?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true, leaveType: true },
    });

    if (!request || request.employee.companyId !== companyId) {
      throw new NotFoundException('Leave request not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.APPROVED,
          approvedByHr: hrId,
          hrComment: comment,
        },
      });

      // 2. Update balance
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

  async reject(companyId: string, requestId: string, rejectedBy: string, comment?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true, leaveType: true },
    });

    if (!request || request.employee.companyId !== companyId) {
      throw new NotFoundException('Leave request not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.REJECTED,
          hrComment: comment,
        },
      });

      // Restore pending days
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

  async getCalendar(companyId: string, start: Date, end: Date) {
    return this.prisma.leaveRequest.findMany({
      where: {
        employee: { companyId },
        status: { in: [LeaveStatus.APPROVED, LeaveStatus.APPROVED_BY_MANAGER] },
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

  /**
   * Helper to calculate working days excluding weekends (Fri/Sat in Algeria or Sat/Sun usually)
   * and public holidays.
   */
  private async calculateWorkingDays(companyId: string, start: Date, end: Date): Promise<number> {
    let count = 0;
    const curDate = new Date(start.getTime());

    // Fetch public holidays in the range
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

      // Assuming Sat (6) and Sun (0) are weekends. 
      // For Algeria, it might be Fri (5) and Sat (6). 
      // Let's stick to standard Sat/Sun for now or make it configurable.
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDates.includes(dateStr);

      if (!isWeekend && !isHoliday) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }
}
