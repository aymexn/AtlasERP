import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
export declare class CollaborationController {
    private activityService;
    private notificationService;
    constructor(activityService: ActivityService, notificationService: NotificationService);
    getActivityFeed(req: any, projectId?: string, limit?: string): Promise<{
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
    createActivity(req: any, data: any): Promise<{
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
    getNotifications(req: any): Promise<{
        id: string;
        notificationType: string;
        title: string;
        message: string | null;
        linkUrl: string | null;
        actionType: string | null;
        resourceType: string | null;
        resourceId: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentViaEmail: boolean;
        sentViaPush: boolean;
        createdAt: Date;
        userId: string;
    }[]>;
    getUnreadCount(req: any): Promise<number>;
    markAsRead(id: string): Promise<{
        id: string;
        notificationType: string;
        title: string;
        message: string | null;
        linkUrl: string | null;
        actionType: string | null;
        resourceType: string | null;
        resourceId: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentViaEmail: boolean;
        sentViaPush: boolean;
        createdAt: Date;
        userId: string;
    }>;
}
