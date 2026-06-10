import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppraisalStatus, ReviewStatus } from '@prisma/client';
import { NotificationService } from '../../notifications/notifications.service';

function parseDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    if (value.includes('/')) {
      const [day, month, year] = value.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
  }
  return new Date(value);
}

@Injectable()
export class PerformanceService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async getCycles(companyId: string) {
    return this.prisma.appraisalCycle.findMany({
      where: { companyId },
      include: { _count: { select: { reviews: true } } },
    });
  }

  async createCycle(companyId: string, data: any) {
    try {
      const startDateParsed = parseDate(data.startDate);
      const endDateParsed = parseDate(data.endDate);

      return await this.prisma.appraisalCycle.create({
        data: {
          companyId,
          name: data.name,
          startDate: startDateParsed,
          endDate: endDateParsed,
          status: data.status || 'PLANNED',
        },
      });
    } catch (error) {
      console.error('CREATE CYCLE SERVICE ERROR:', error);
      throw error;
    }
  }

  async initializeReviews(cycleId: string) {
    const cycle = await this.prisma.appraisalCycle.findUnique({
      where: { id: cycleId },
      include: { 
        company: { 
          include: { 
            employees: { 
              where: { status: 'ACTIVE' },
              include: { manager: true }
            } 
          } 
        } 
      },
    });

    if (!cycle) throw new NotFoundException('Cycle not found');

    const reviews = [];
    for (const employee of cycle.company.employees) {
      if (!employee.managerId) continue; // Skip if no manager assigned

      const review = await this.prisma.performanceReview.upsert({
        where: { cycleId_employeeId: { cycleId, employeeId: employee.id } },
        update: {},
        create: {
          cycleId,
          employeeId: employee.id,
          reviewerId: employee.managerId,
          status: ReviewStatus.DRAFT,
        },
      });
      reviews.push(review);

      // Notify Reviewer (Manager)
      const empWithManager = employee as any;
      if (empWithManager.manager?.email) {
          this.notificationService.sendEmail(
              empWithManager.manager.email,
              `Nouvelle évaluation à réaliser : ${employee.firstName} ${employee.lastName}`,
              'performance-review-assigned',
              { cycle: cycle.name, employee: `${employee.firstName} ${employee.lastName}` }
          ).catch(console.error);
      }
    }

    return reviews;
  }

  async getReviews(cycleId: string) {
    return this.prisma.performanceReview.findMany({
      where: { cycleId },
      include: {
        employee: true,
        reviewer: true,
        objectives: true,
      },
    });
  }

  async updateSelfReview(reviewId: string, data: any) {
    return this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: {
        selfReview: data.selfReview,
        status: ReviewStatus.SELF_REVIEW,
      },
    });
  }

  async updateManagerReview(reviewId: string, data: any) {
    return this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: {
        managerReview: data.managerReview,
        finalRating: data.finalRating,
        status: ReviewStatus.COMPLETED,
      },
    });
  }

  async createObjective(reviewId: string, data: any) {
    return this.prisma.objective.create({
      data: {
        ...data,
        reviewId,
      },
    });
  }

  async getEmployeeHistory(employeeId: string) {
    return this.prisma.performanceReview.findMany({
      where: { employeeId },
      include: { cycle: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
