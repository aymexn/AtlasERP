import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("=========================================");
  console.log("Database Inspection - Notifications & Mocks");
  console.log("=========================================");

  // Count tables
  const customerCount = await prisma.customer.count();
  const salesOrderCount = await prisma.salesOrder.count();
  const invoiceCount = await prisma.invoice.count();
  const notificationCount = await prisma.notification.count();

  console.log(`Customers: ${customerCount}`);
  console.log(`Sales Orders: ${salesOrderCount}`);
  console.log(`Invoices: ${invoiceCount}`);
  console.log(`Notifications: ${notificationCount}`);

  // Inspect Customers
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, email: true, isActive: true }
  });
  console.log("\n--- Customers List ---");
  customers.forEach(c => {
    console.log(`ID: ${c.id} | Name: ${c.name} | Email: ${c.email} | Active: ${c.isActive}`);
  });

  // Inspect Notifications
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log("\n--- Recent Notifications ---");
  notifications.forEach(n => {
    console.log(`ID: ${n.id} | Type: ${n.notificationType} | Title: ${n.title} | Message: ${n.message}`);
  });

  // Inspect Sales Orders
  const orders = await prisma.salesOrder.findMany({
    select: { id: true, reference: true, status: true, customer: { select: { name: true } } },
    take: 10
  });
  console.log("\n--- Sales Orders ---");
  orders.forEach(o => {
    console.log(`ID: ${o.id} | Ref: ${o.reference} | Status: ${o.status} | Customer: ${o.customer?.name}`);
  });

  // Inspect Invoices
  const invoices = await prisma.invoice.findMany({
    select: { id: true, reference: true, status: true, customer: { select: { name: true } } },
    take: 10
  });
  console.log("\n--- Invoices ---");
  invoices.forEach(i => {
    console.log(`ID: ${i.id} | Ref: ${i.reference} | Status: ${i.status} | Customer: ${i.customer?.name}`);
  });
  
  console.log("=========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
