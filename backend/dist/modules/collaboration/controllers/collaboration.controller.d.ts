import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
export declare class CollaborationController {
    private activityService;
    private notificationService;
    constructor(activityService: ActivityService, notificationService: NotificationService);
    getActivityFeed(req: any, projectId?: string, limit?: string): Promise<{
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
    createActivity(req: any, data: any): Promise<{
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
    getNotifications(req: any): Promise<{
        id: string;
        createdAt: Date;
        message: string | null;
        userId: string;
        actionType: string | null;
        resourceType: string | null;
        resourceId: string | null;
        title: string;
        notificationType: string;
        linkUrl: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentViaEmail: boolean;
        sentViaPush: boolean;
    }[]>;
    getUnreadCount(req: any): Promise<number>;
    markAsRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        message: string | null;
        userId: string;
        actionType: string | null;
        resourceType: string | null;
        resourceId: string | null;
        title: string;
        notificationType: string;
        linkUrl: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentViaEmail: boolean;
        sentViaPush: boolean;
    }>;
}
