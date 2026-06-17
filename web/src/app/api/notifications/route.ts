import { NextResponse } from 'next/server';
import { getUserId, getTenantId } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await getUserId();
    const companyId = await getTenantId();

    if (!userId || !companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // 1. Factures impayées
    const unpaidInvoices = await prisma.invoice.findMany({
      where: { companyId, status: { not: 'PAID' }, dueDate: { lt: now } },
      include: { customer: true }
    });
    for (const inv of unpaidInvoices) {
      const exists = await prisma.notification.findFirst({
        where: { userId, resourceType: 'Invoice', resourceId: inv.id, notificationType: 'unpaid-invoice' }
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId,
            notificationType: 'unpaid-invoice',
            title: 'Facture impayée',
            message: `La facture ${inv.reference} de ${inv.customer.name} est en retard (${Number(inv.amountRemaining).toLocaleString('fr-DZ')} DA restante)`,
            linkUrl: '/invoices',
            resourceType: 'Invoice',
            resourceId: inv.id,
            isRead: false
          }
        });
      }
    }

    // 2. Alertes Stock
    const stockAlerts = await prisma.product.findMany({
      where: { companyId, isActive: true, stockQuantity: { lte: prisma.product.fields.reorderPoint } }
    });
    for (const prod of stockAlerts) {
      const exists = await prisma.notification.findFirst({
        where: { userId, resourceType: 'Product', resourceId: prod.id, notificationType: 'low-stock-alert' }
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId,
            notificationType: 'low-stock-alert',
            title: 'Alerte Stock',
            message: `Le produit ${prod.name} (SKU: ${prod.sku}) est en alerte : ${Number(prod.stockQuantity)} en stock (seuil: ${Number(prod.reorderPoint)})`,
            linkUrl: '/inventory/stock-status',
            resourceType: 'Product',
            resourceId: prod.id,
            isRead: false
          }
        });
      }
    }

    // 3. Paiements reçus (last 24h)
    const recentPayments = await prisma.payment.findMany({
      where: { companyId, date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: { invoice: true }
    });
    for (const pay of recentPayments) {
      const exists = await prisma.notification.findFirst({
        where: { userId, resourceType: 'Payment', resourceId: pay.id, notificationType: 'payment-received' }
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId,
            notificationType: 'payment-received',
            title: 'Paiement reçu',
            message: `Paiement de ${Number(pay.amount).toLocaleString('fr-DZ')} DA reçu pour la facture ${pay.invoice?.reference || ''}`,
            linkUrl: '/invoices',
            resourceType: 'Payment',
            resourceId: pay.id,
            isRead: false
          }
        });
      }
    }

    // 4. Commandes en attente (DRAFT or SENT)
    const pendingPOs = await prisma.purchaseOrder.findMany({
      where: { companyId, status: { in: ['DRAFT', 'SENT'] } }
    });
    for (const po of pendingPOs) {
      const exists = await prisma.notification.findFirst({
        where: { userId, resourceType: 'PurchaseOrder', resourceId: po.id, notificationType: 'purchase-order-pending' }
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId,
            notificationType: 'purchase-order-pending',
            title: 'Commande en attente',
            message: `La commande d'achat ${po.reference} est en attente d'approbation (Montant: ${Number(po.totalTtc).toLocaleString('fr-DZ')} DA)`,
            linkUrl: '/purchases/orders',
            resourceType: 'PurchaseOrder',
            resourceId: po.id,
            isRead: false
          }
        });
      }
    }

    // 5. Nouveaux clients (last 7 days)
    const newCustomers = await prisma.customer.findMany({
      where: { companyId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    for (const cust of newCustomers) {
      const exists = await prisma.notification.findFirst({
        where: { userId, resourceType: 'Customer', resourceId: cust.id, notificationType: 'new-customer' }
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId,
            notificationType: 'new-customer',
            title: 'Nouveau client',
            message: `Le client ${cust.name} a été créé récemment`,
            linkUrl: '/sales/customers',
            resourceType: 'Customer',
            resourceId: cust.id,
            isRead: false
          }
        });
      }
    }

    // Retrieve notifications list and total unread count
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    const mappedNotifications = notifications.map(n => {
      let priority = 'info';
      if (n.notificationType === 'low-stock-alert' || n.notificationType === 'unpaid-invoice') {
        priority = 'urgent';
      } else if (n.notificationType === 'purchase-order-pending' || n.notificationType === 'payment-received') {
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

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearRead = searchParams.get('clearRead');

    if (clearRead === 'true') {
      await prisma.notification.deleteMany({
        where: { userId, isRead: true }
      });
    } else if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId }
      });
    } else {
      // Clear all
      await prisma.notification.deleteMany({
        where: { userId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NOTIFICATIONS_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
