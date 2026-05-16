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
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const collaboration_gateway_1 = require("../gateways/collaboration.gateway");
let ActivityService = class ActivityService {
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async createActivity(data) {
        const activity = await this.prisma.activityFeed.create({
            data: {
                companyId: data.companyId,
                userId: data.userId,
                activityType: data.activityType,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                resourceTitle: data.resourceTitle,
                description: data.description,
                projectId: data.projectId,
                metadata: data.metadata || {},
            },
            include: {
                user: {
                    select: { email: true, employee: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        const userName = activity.user?.employee
            ? `${activity.user.employee.firstName} ${activity.user.employee.lastName}`
            : activity.user?.email || 'Système';
        const activityWithUserName = { ...activity, userName };
        if (data.projectId) {
            this.gateway.emitToProject(data.projectId, 'new_activity', activityWithUserName);
        }
        else {
            this.gateway.broadcast('new_activity', activityWithUserName);
        }
        return activityWithUserName;
    }
    async getActivityFeed(companyId, projectId, limit = 50) {
        const activities = await this.prisma.activityFeed.findMany({
            where: {
                companyId,
                ...(projectId ? { projectId } : {}),
            },
            include: {
                user: {
                    select: { email: true, employee: { select: { firstName: true, lastName: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return activities.map(a => ({
            ...a,
            userName: a.user?.employee
                ? `${a.user.employee.firstName} ${a.user.employee.lastName}`
                : a.user?.email || 'Système'
        }));
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        collaboration_gateway_1.CollaborationGateway])
], ActivityService);
//# sourceMappingURL=activity.service.js.map