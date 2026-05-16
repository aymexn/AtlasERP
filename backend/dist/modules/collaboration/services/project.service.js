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
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const activity_service_1 = require("./activity.service");
const collaboration_gateway_1 = require("../gateways/collaboration.gateway");
let ProjectService = class ProjectService {
    constructor(prisma, activityService, gateway) {
        this.prisma = prisma;
        this.activityService = activityService;
        this.gateway = gateway;
    }
    async createProject(companyId, userId, data) {
        const project = await this.prisma.project.create({
            data: {
                ...data,
                companyId,
                createdBy: userId,
            },
        });
        await this.activityService.createActivity({
            companyId,
            userId,
            activityType: 'project_created',
            resourceType: 'project',
            resourceId: project.id,
            resourceTitle: project.name,
            description: `a créé le projet "${project.name}"`,
        });
        return project;
    }
    async getProjects(companyId) {
        return this.prisma.project.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
    }
    async getProjectById(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                milestones: {
                    orderBy: { dueDate: 'asc' },
                },
                tasks: {
                    include: {
                        assignedTo: {
                            select: { email: true, employee: { select: { firstName: true, lastName: true } } },
                        },
                    },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        if (!project)
            throw new common_1.NotFoundException('Projet non trouvé');
        return project;
    }
    async createTask(companyId, userId, projectId, data) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        const taskCount = await this.prisma.projectTask.count({ where: { projectId } });
        const taskNumber = `${project.code || 'TASK'}-${taskCount + 1}`;
        const task = await this.prisma.projectTask.create({
            data: {
                ...data,
                projectId,
                taskNumber,
                createdBy: userId,
            },
        });
        await this.activityService.createActivity({
            companyId,
            userId,
            activityType: 'task_created',
            resourceType: 'task',
            resourceId: task.id,
            resourceTitle: task.title,
            description: `a créé la tâche "${task.title}" dans le projet ${project.name}`,
            projectId,
        });
        this.gateway.emitToProject(projectId, 'task_created', task);
        return task;
    }
    async updateTask(taskId, data, userId) {
        const task = await this.prisma.projectTask.update({
            where: { id: taskId },
            data,
        });
        if (data.status || data.boardColumn) {
            this.gateway.emitToProject(task.projectId, 'task_updated', task);
        }
        return task;
    }
    async moveTask(taskId, data) {
        const task = await this.prisma.projectTask.update({
            where: { id: taskId },
            data: {
                boardColumn: data.boardColumn,
                displayOrder: data.displayOrder,
                status: data.boardColumn === 'DONE' ? 'DONE' : undefined
            },
        });
        this.gateway.emitToProject(task.projectId, 'task_moved', {
            taskId: task.id,
            boardColumn: data.boardColumn,
            displayOrder: data.displayOrder,
        });
        return task;
    }
    async deleteTask(taskId) {
        const task = await this.prisma.projectTask.delete({
            where: { id: taskId },
        });
        this.gateway.emitToProject(task.projectId, 'task_deleted', taskId);
        return task;
    }
    async getKanbanBoard(projectId) {
        const tasks = await this.prisma.projectTask.findMany({
            where: { projectId },
            include: {
                assignedTo: {
                    select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
        const columns = {
            'TODO': tasks.filter(t => t.boardColumn === 'TODO' || !t.boardColumn),
            'IN_PROGRESS': tasks.filter(t => t.boardColumn === 'IN_PROGRESS'),
            'IN_REVIEW': tasks.filter(t => t.boardColumn === 'IN_REVIEW'),
            'DONE': tasks.filter(t => t.boardColumn === 'DONE'),
        };
        return columns;
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService,
        collaboration_gateway_1.CollaborationGateway])
], ProjectService);
//# sourceMappingURL=project.service.js.map