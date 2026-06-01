import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306';
  const nourId = '45fa59b6-b096-4a40-946c-13b4c8988b56';

  console.log('Starting cleanup...');

  // Get all customer IDs for the company except Nour
  const fakeCustomers = await prisma.customer.findMany({
    where: {
      companyId,
      id: { not: nourId }
    },
    select: { id: true, name: true }
  });

  const fakeCustomerIds = fakeCustomers.map(c => c.id);
  console.log(`Found ${fakeCustomerIds.length} fake customers to delete.`);

  if (fakeCustomerIds.length > 0) {
    // 1. Delete payments related to fake invoices
    const paymentDelete = await prisma.payment.deleteMany({
      where: {
        companyId,
        invoice: {
          customerId: { in: fakeCustomerIds }
        }
      }
    });
    console.log(`Deleted ${paymentDelete.count} fake payments.`);

    // 2. Delete invoices related to fake customers
    const invoiceDelete = await prisma.invoice.deleteMany({
      where: {
        companyId,
        customerId: { in: fakeCustomerIds }
      }
    });
    console.log(`Deleted ${invoiceDelete.count} fake invoices.`);

    // 3. Delete stock movements related to fake orders
    const stockMovementDelete = await prisma.stockMovement.deleteMany({
      where: {
        companyId,
        salesOrder: {
          customerId: { in: fakeCustomerIds }
        }
      }
    });
    console.log(`Deleted ${stockMovementDelete.count} fake stock movements.`);

    // 4. Delete sales order lines related to fake orders
    const orderLineDelete = await prisma.salesOrderLine.deleteMany({
      where: {
        salesOrder: {
          companyId,
          customerId: { in: fakeCustomerIds }
        }
      }
    });
    console.log(`Deleted ${orderLineDelete.count} fake sales order lines.`);

    // 5. Delete sales orders related to fake customers
    const salesOrderDelete = await prisma.salesOrder.deleteMany({
      where: {
        companyId,
        customerId: { in: fakeCustomerIds }
      }
    });
    console.log(`Deleted ${salesOrderDelete.count} fake sales orders.`);

    // 6. Delete customer contacts related to fake customers
    const contactsDelete = await prisma.customerContact.deleteMany({
      where: {
        companyId,
        customerId: { in: fakeCustomerIds }
      }
    });
    console.log(`Deleted ${contactsDelete.count} fake contacts.`);

    // 7. Delete fake customers themselves
    const customerDelete = await prisma.customer.deleteMany({
      where: {
        companyId,
        id: { in: fakeCustomerIds }
      }
    });
    console.log(`Deleted ${customerDelete.count} fake customers.`);
  }

  console.log('Cleanup finished successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
