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
            employee: {
                firstName: string;
                lastName: string;
            };
            email: string;
        };
        id: string;
        createdAt: Date;
        companyId: string;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        resourceType: string;
        resourceId: string;
        activityType: string;
        resourceTitle: string | null;
        visibility: string;
        departmentId: string | null;
        projectId: string | null;
    }>;
    getActivityFeed(companyId: string, projectId?: string, limit?: number): Promise<{
        userName: string;
        user: {
            employee: {
                firstName: string;
                lastName: string;
            };
            email: string;
        };
        id: string;
        createdAt: Date;
        companyId: string;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        resourceType: string;
        resourceId: string;
        activityType: string;
        resourceTitle: string | null;
        visibility: string;
        departmentId: string | null;
        projectId: string | null;
    }[]>;
}
