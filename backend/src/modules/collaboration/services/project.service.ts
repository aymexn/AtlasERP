import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from './activity.service';
import { CollaborationGateway } from '../gateways/collaboration.gateway';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private gateway: CollaborationGateway,
  ) {}

  async createProject(companyId: string, userId: string, data: any) {
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

  async getProjects(companyId: string) {
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

  async getProjectById(id: string) {
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

    if (!project) throw new NotFoundException('Projet non trouvé');
    return project;
  }

  async createTask(companyId: string, userId: string, projectId: string, data: any) {
    // Generate task number if needed
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

    // Notify via Socket
    this.gateway.emitToProject(projectId, 'task_created', task);

    return task;
  }

  async updateTask(taskId: string, data: any, userId: string) {
    const task = await this.prisma.projectTask.update({
      where: { id: taskId },
      data,
    });

    if (data.status || data.boardColumn) {
        this.gateway.emitToProject(task.projectId, 'task_updated', task);
    }

    return task;
  }

  async moveTask(taskId: string, data: { boardColumn: string, displayOrder: number }) {
    const task = await this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        boardColumn: data.boardColumn,
        displayOrder: data.displayOrder,
        status: data.boardColumn === 'DONE' ? 'DONE' : undefined
      },
    });

    // Notify other clients in the project room
    this.gateway.emitToProject(task.projectId, 'task_moved', {
        taskId: task.id,
        boardColumn: data.boardColumn,
        displayOrder: data.displayOrder,
    });

    return task;
  }

  async deleteTask(taskId: string) {
    const task = await this.prisma.projectTask.delete({
      where: { id: taskId },
    });
    
    this.gateway.emitToProject(task.projectId, 'task_deleted', taskId);
    return task;
  }

  async getKanbanBoard(projectId: string) {
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
}
