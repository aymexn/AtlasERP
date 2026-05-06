import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppraisalStatus, ReviewStatus } from '@prisma/client';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async getCycles(companyId: string) {
    return this.prisma.appraisalCycle.findMany({
      where: { companyId },
      include: { _count: { select: { reviews: true } } },
    });
  }

  async createCycle(companyId: string, data: any) {
    return this.prisma.appraisalCycle.create({
      data: {
        ...data,
        companyId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async initializeReviews(cycleId: string) {
    const cycle = await this.prisma.appraisalCycle.findUnique({
      where: { id: cycleId },
      include: { company: { include: { employees: { where: { status: 'ACTIVE' } } } } },
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
