import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, CandidateStatus, ApplicationStage } from '@prisma/client';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // Job Postings
  async getJobPostings(companyId: string) {
    return this.prisma.jobPosting.findMany({
      where: { companyId },
      include: { _count: { select: { applications: true } } },
    });
  }

  async createJobPosting(companyId: string, data: any, userId: string) {
    return this.prisma.jobPosting.create({
      data: {
        ...data,
        companyId,
        postedBy: userId,
      },
    });
  }

  // Candidates & Applications
  async getCandidates(companyId: string) {
    return this.prisma.candidate.findMany({
      where: { companyId },
      include: { applications: { include: { jobPosting: true } } },
    });
  }

  async createCandidate(companyId: string, data: any) {
    return this.prisma.candidate.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async applyToJob(jobPostingId: string, candidateId: string, notes?: string) {
    return this.prisma.jobApplication.create({
      data: {
        jobPostingId,
        candidateId,
        notes,
      },
    });
  }

  async getApplications(companyId: string, jobPostingId?: string) {
    const where: any = { jobPosting: { companyId } };
    if (jobPostingId) where.jobPostingId = jobPostingId;

    return this.prisma.jobApplication.findMany({
      where,
      include: {
        candidate: true,
        jobPosting: true,
        interviews: true,
        offers: true,
      },
    });
  }

  async updateApplicationStage(applicationId: string, stage: ApplicationStage) {
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { stage },
    });
  }

  // Interviews
  async scheduleInterview(applicationId: string, data: any) {
    return this.prisma.interview.create({
      data: {
        ...data,
        applicationId,
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  }

  // Hiring
  async hireCandidate(companyId: string, applicationId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { candidate: true, jobPosting: true },
    });

    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Employee Profile
      const employee = await tx.employee.create({
        data: {
          companyId,
          firstName: application.candidate.firstName,
          lastName: application.candidate.lastName,
          email: application.candidate.email,
          phone: application.candidate.phone,
          position: application.jobPosting.title,
          department: application.jobPosting.department,
          hireDate: new Date(),
          status: 'ACTIVE',
        },
      });

      // 2. Update Application & Candidate Status
      await tx.jobApplication.update({
        where: { id: applicationId },
        data: { stage: ApplicationStage.HIRED },
      });

      await tx.candidate.update({
        where: { id: application.candidateId },
        data: { status: CandidateStatus.HIRED },
      });

      // 3. Close Job Posting if needed (Optional)
      
      return employee;
    });
  }
}
