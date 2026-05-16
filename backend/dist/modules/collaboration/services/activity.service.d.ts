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
        companyId: string;
        createdAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
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
        companyId: string;
        createdAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        resourceType: string;
        resourceId: string;
        activityType: string;
        resourceTitle: string | null;
        visibility: string;
        departmentId: string | null;
        projectId: string | null;
    }[]>;
}
