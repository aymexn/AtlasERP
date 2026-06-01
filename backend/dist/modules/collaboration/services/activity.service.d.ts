import { PrismaService } from '../../prisma/prisma.service';
import { CollaborationGateway } from '../gateways/collaboration.gateway';
export declare class ActivityService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: CollaborationGateway);
    createActivity(data: {
        companyId: string;
        userId: string;
        activityType: string;
        resourceType: string;
        resourceId: string;
        resourceTitle?: string;
        description?: string;
        projectId?: string;
        metadata?: any;
    }): Promise<{
        userName: string;
        user: {
            email: string;
            employee: {
                firstName: string;
                lastName: string;
            };
        };
        id: string;
        resourceType: string;
        resourceId: string;
        createdAt: Date;
        userId: string;
        companyId: string;
        activityType: string;
        resourceTitle: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        visibility: string;
        departmentId: string | null;
        projectId: string | null;
    }>;
    getActivityFeed(companyId: string, projectId?: string, limit?: number): Promise<{
        userName: string;
        user: {
            email: string;
            employee: {
                firstName: string;
                lastName: string;
            };
        };
        id: string;
        resourceType: string;
        resourceId: string;
        createdAt: Date;
        userId: string;
        companyId: string;
        activityType: string;
        resourceTitle: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        visibility: string;
        departmentId: string | null;
        projectId: string | null;
    }[]>;
}
