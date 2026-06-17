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
        message: string | null;
        id: string;
        createdAt: Date;
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
    getUnreadCount(userId: string): Promise<number>;
    getNotifications(userId: string): Promise<{
        message: string | null;
        id: string;
        createdAt: Date;
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
    markAsRead(id: string): Promise<{
        message: string | null;
        id: string;
        createdAt: Date;
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
