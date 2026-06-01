import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Searching for "test" entities in the database...');

  // 1. Find Products named "test"
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: 'test',
        mode: 'insensitive'
      }
    }
  });
  console.log(`Found ${products.length} products matching "test":`);
  products.forEach(p => console.log(`- Product: ${p.name} (ID: ${p.id}, SKU: ${p.sku})`));

  // 2. Find Customers named "test"
  const customers = await prisma.customer.findMany({
    where: {
      name: {
        contains: 'test',
        mode: 'insensitive'
      }
    }
  });
  console.log(`Found ${customers.length} customers matching "test":`);
  customers.forEach(c => console.log(`- Customer: ${c.name} (ID: ${c.id})`));

  // 3. Delete matching Products
  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    
    // Check if they are referenced in other tables to avoid foreign key violations
    // We should delete related records or just set isActive to false or delete them safely
    console.log('Attempting to delete related stock movements and products...');
    
    const delMovements = await prisma.stockMovement.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delMovements.count} related stock movements.`);

    const delStock = await prisma.productStock.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delStock.count} related product stock entries.`);

    const delClass = await prisma.abcClassification.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delClass.count} related ABC classifications.`);

    const delDead = await prisma.deadStockItem.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delDead.count} related dead stock items.`);

    const delReorder = await prisma.reorderPoint.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delReorder.count} related reorder points.`);

    const delMoLines = await prisma.manufacturingOrderLine.deleteMany({
      where: { componentProductId: { in: productIds } }
    });
    console.log(`Deleted ${delMoLines.count} related manufacturing order lines.`);

    const delMo = await prisma.manufacturingOrder.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delMo.count} related manufacturing orders.`);

    const delPoLines = await prisma.purchaseOrderLine.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delPoLines.count} related purchase order lines.`);

    const delSoLines = await prisma.salesOrderLine.deleteMany({
      where: { productId: { in: productIds } }
    });
    console.log(`Deleted ${delSoLines.count} related sales order lines.`);

    const deletedProducts = await prisma.product.deleteMany({
      where: { id: { in: productIds } }
    });
    console.log(`Deleted ${deletedProducts.count} products.`);
  }

  // 4. Delete matching Customers
  if (customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    
    const delPayments = await prisma.payment.deleteMany({
      where: {
        invoice: {
          customerId: { in: customerIds }
        }
      }
    });
    console.log(`Deleted ${delPayments.count} payments for matching customers.`);

    const delInvoices = await prisma.invoice.deleteMany({
      where: { customerId: { in: customerIds } }
    });
    console.log(`Deleted ${delInvoices.count} invoices for matching customers.`);

    const delSo = await prisma.salesOrder.deleteMany({
      where: { customerId: { in: customerIds } }
    });
    console.log(`Deleted ${delSo.count} sales orders for matching customers.`);

    const deletedCustomers = await prisma.customer.deleteMany({
      where: { id: { in: customerIds } }
    });
    console.log(`Deleted ${deletedCustomers.count} customers.`);
  }

  // 5. Check if there are any specific audit logs/activity logs that mention "test"
  console.log('Done cleaning up test data!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
