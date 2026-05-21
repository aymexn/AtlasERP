import { NextResponse } from 'next/server';
import { getUserId, getTenantId } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = await getTenantId();
    if (companyId) {
      // 1. Generate low stock alerts
      const products = await prisma.product.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, stockQuantity: true, reorderPoint: true, unit: true }
      });
      const lowStockProducts = products.filter(p => Number(p.stockQuantity) < Number(p.reorderPoint));
      for (const product of lowStockProducts.slice(0, 5)) { // Limit to 5 alerts to avoid spam
        const existing = await prisma.notification.findFirst({
          where: { userId, notificationType: 'low-stock-alert', resourceId: product.id }
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              notificationType: 'low-stock-alert',
              title: `Alerte Stock : ${product.name}`,
              message: `Le stock (${Number(product.stockQuantity)}) est inférieur au seuil (${Number(product.reorderPoint)} ${product.unit || 'unités'}).`,
              linkUrl: '/inventory/products-stock',
              resourceType: 'Product',
              resourceId: product.id
            }
          });
        }
      }

      // 2. Generate overdue invoices alerts
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          companyId,
          status: { in: ['OVERDUE', 'SENT'] },
          dueDate: { lt: new Date() }
        },
        select: { id: true, reference: true, amountRemaining: true, customer: { select: { name: true } } }
      });
      for (const invoice of overdueInvoices.slice(0, 5)) {
        const existing = await prisma.notification.findFirst({
          where: { userId, notificationType: 'invoice-overdue-alert', resourceId: invoice.id }
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              notificationType: 'invoice-overdue-alert',
              title: `Facture en retard : ${invoice.reference}`,
              message: `Facture de ${invoice.customer.name} impayée (solde: ${Number(invoice.amountRemaining).toLocaleString('fr-DZ')} DA).`,
              linkUrl: '/invoices',
              resourceType: 'Invoice',
              resourceId: invoice.id
            }
          });
        }
      }

      // 3. Generate negative cash flow warning
      const cashFlowKpi = await prisma.companyKpi.findUnique({
        where: { companyId_metric: { companyId, metric: 'cash_flow' } }
      });
      if (cashFlowKpi && Number(cashFlowKpi.value) < 0) {
        const existing = await prisma.notification.findFirst({
          where: { userId, notificationType: 'cash-flow-alert' }
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              notificationType: 'cash-flow-alert',
              title: 'Trésorerie Critique',
              message: `Flux de trésorerie net négatif : ${Number(cashFlowKpi.value).toLocaleString('fr-DZ')} DA.`,
              linkUrl: '/treasury/forecast'
            }
          });
        }
      }

      // 4. Generate pending sales orders alerts
      const pendingOrders = await prisma.salesOrder.findMany({
        where: {
          companyId,
          status: { in: ['CONFIRMED', 'VALIDATED'] }
        },
        select: { id: true, reference: true, totalAmountTtc: true, customer: { select: { name: true } } }
      });
      for (const order of pendingOrders.slice(0, 5)) {
        const existing = await prisma.notification.findFirst({
          where: { userId, notificationType: 'sales-order-pending', resourceId: order.id }
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              notificationType: 'sales-order-pending',
              title: `Commande à traiter : ${order.reference}`,
              message: `Commande de ${order.customer.name} (${Number(order.totalAmountTtc).toLocaleString('fr-DZ')} DA) en attente.`,
              linkUrl: '/sales/orders',
              resourceType: 'SalesOrder',
              resourceId: order.id
            }
          });
        }
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

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

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
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
