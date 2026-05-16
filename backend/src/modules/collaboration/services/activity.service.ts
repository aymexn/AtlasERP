import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CollaborationGateway } from '../gateways/collaboration.gateway';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private gateway: CollaborationGateway,
  ) {}

  async createActivity(data: {
    companyId: string;
    userId: string;
    activityType: string;
    resourceType: string;
    resourceId: string;
    resourceTitle?: string;
    description?: string;
    projectId?: string;
    metadata?: any;
  }) {
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

    // Emit real-time activity
    if (data.projectId) {
      this.gateway.emitToProject(data.projectId, 'new_activity', activityWithUserName);
    } else {
      this.gateway.broadcast('new_activity', activityWithUserName);
    }

    return activityWithUserName;
  }

  async getActivityFeed(companyId: string, projectId?: string, limit: number = 50) {
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
}
