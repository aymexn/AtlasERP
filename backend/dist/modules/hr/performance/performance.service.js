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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../../notifications/notifications.service");
let PerformanceService = class PerformanceService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async getCycles(companyId) {
        return this.prisma.appraisalCycle.findMany({
            where: { companyId },
            include: { _count: { select: { reviews: true } } },
        });
    }
    async createCycle(companyId, data) {
        return this.prisma.appraisalCycle.create({
            data: {
                ...data,
                companyId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            },
        });
    }
    async initializeReviews(cycleId) {
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
        if (!cycle)
            throw new common_1.NotFoundException('Cycle not found');
        const reviews = [];
        for (const employee of cycle.company.employees) {
            if (!employee.managerId)
                continue;
            const review = await this.prisma.performanceReview.upsert({
                where: { cycleId_employeeId: { cycleId, employeeId: employee.id } },
                update: {},
                create: {
                    cycleId,
                    employeeId: employee.id,
                    reviewerId: employee.managerId,
                    status: client_1.ReviewStatus.DRAFT,
                },
            });
            reviews.push(review);
            const empWithManager = employee;
            if (empWithManager.manager?.email) {
                this.notificationService.sendEmail(empWithManager.manager.email, `Nouvelle évaluation à réaliser : ${employee.firstName} ${employee.lastName}`, 'performance-review-assigned', { cycle: cycle.name, employee: `${employee.firstName} ${employee.lastName}` }).catch(console.error);
            }
        }
        return reviews;
    }
    async getReviews(cycleId) {
        return this.prisma.performanceReview.findMany({
            where: { cycleId },
            include: {
                employee: true,
                reviewer: true,
                objectives: true,
            },
        });
    }
    async updateSelfReview(reviewId, data) {
        return this.prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                selfReview: data.selfReview,
                status: client_1.ReviewStatus.SELF_REVIEW,
            },
        });
    }
    async updateManagerReview(reviewId, data) {
        return this.prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                managerReview: data.managerReview,
                finalRating: data.finalRating,
                status: client_1.ReviewStatus.COMPLETED,
            },
        });
    }
    async createObjective(reviewId, data) {
        return this.prisma.objective.create({
            data: {
                ...data,
                reviewId,
            },
        });
    }
    async getEmployeeHistory(employeeId) {
        return this.prisma.performanceReview.findMany({
            where: { employeeId },
            include: { cycle: true },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map