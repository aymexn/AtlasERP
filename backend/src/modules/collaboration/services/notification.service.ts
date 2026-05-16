import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CollaborationGateway } from '../gateways/collaboration.gateway';

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService,
        private gateway: CollaborationGateway,
    ) {}

    async createNotification(userId: string, data: {
        title: string;
        message?: string;
        notificationType: string;
        linkUrl?: string;
        resourceType?: string;
        resourceId?: string;
    }) {
        const notification = await this.prisma.notification.create({
            data: {
                user: { connect: { id: userId } },
                ...data,
            },
        });

        // Emit real-time notification
        this.gateway.emitToUser(userId, 'new_notification', notification);

        return notification;
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    async getNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }
}
