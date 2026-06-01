import { NextResponse } from 'next/server';
import { getUserId, getTenantId } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 7. Parallelize retrieving notifications list and total unread count
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    const mappedNotifications = notifications.map(n => {
      let priority = 'info';
      if (n.notificationType === 'low-stock-alert' || n.notificationType.includes('alert') || n.title.toLowerCase().includes('urgent') || n.title.toLowerCase().includes('critique')) {
        priority = 'urgent';
      } else if (n.notificationType.includes('payment') || n.notificationType.includes('invoice') || n.title.toLowerCase().includes('important') || n.notificationType.includes('pending')) {
        priority = 'important';
      }

      return {
        ...n,
        priority
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'mark_all_read') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
      });
    } else if (action === 'mark_read' && notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NOTIFICATIONS_PUT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
