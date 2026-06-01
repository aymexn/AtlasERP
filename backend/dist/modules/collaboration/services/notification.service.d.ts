import { PrismaService } from '../../prisma/prisma.service';
import { CollaborationGateway } from '../gateways/collaboration.gateway';
export declare class NotificationService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: CollaborationGateway);
    createNotification(userId: string, data: {
        title: string;
        message?: string;
        notificationType: string;
        linkUrl?: string;
        resourceType?: string;
        resourceId?: string;
    }): Promise<{
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
    getUnreadCount(userId: string): Promise<number>;
    getNotifications(userId: string): Promise<{
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
