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
exports.RecruitmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let RecruitmentService = class RecruitmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getJobPostings(companyId) {
        return this.prisma.jobPosting.findMany({
            where: { companyId },
            include: { _count: { select: { applications: true } } },
        });
    }
    async createJobPosting(companyId, data, userId) {
        return this.prisma.jobPosting.create({
            data: {
                ...data,
                companyId,
                postedBy: userId,
            },
        });
    }
    async getCandidates(companyId) {
        return this.prisma.candidate.findMany({
            where: { companyId },
            include: { applications: { include: { jobPosting: true } } },
        });
    }
    async createCandidate(companyId, data) {
        return this.prisma.candidate.create({
            data: {
                ...data,
                companyId,
            },
        });
    }
    async applyToJob(jobPostingId, candidateId, notes) {
        return this.prisma.jobApplication.create({
            data: {
                jobPostingId,
                candidateId,
                notes,
            },
        });
    }
    async getApplications(companyId, jobPostingId) {
        const where = { jobPosting: { companyId } };
        if (jobPostingId)
            where.jobPostingId = jobPostingId;
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
    async updateApplicationStage(applicationId, stage) {
        return this.prisma.jobApplication.update({
            where: { id: applicationId },
            data: { stage },
        });
    }
    async scheduleInterview(applicationId, data) {
        return this.prisma.interview.create({
            data: {
                ...data,
                applicationId,
                scheduledAt: new Date(data.scheduledAt),
            },
        });
    }
    async hireCandidate(companyId, applicationId) {
        const application = await this.prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: { candidate: true, jobPosting: true },
        });
        if (!application)
            throw new common_1.NotFoundException('Application not found');
        return this.prisma.$transaction(async (tx) => {
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
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { stage: client_1.ApplicationStage.HIRED },
            });
            await tx.candidate.update({
                where: { id: application.candidateId },
                data: { status: client_1.CandidateStatus.HIRED },
            });
            return employee;
        });
    }
};
exports.RecruitmentService = RecruitmentService;
exports.RecruitmentService = RecruitmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecruitmentService);
//# sourceMappingURL=recruitment.service.js.map