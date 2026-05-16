const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const po = await prisma.purchaseOrder.findFirst({
    where: { reference: 'BCF-202605-0001' },
    include: {
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!po) {
    console.log('PO not found');
    return;
  }

  console.log(`PO Reference: ${po.reference}`);
  console.log(`PO Status: ${po.status}`);
  po.lines.forEach(line => {
    console.log(`- Product: ${line.product.name} (${line.product.sku})`);
    console.log(`  PO Qty: ${line.quantity}`);
    console.log(`  Received Qty: ${line.receivedQty}`);
    console.log(`  PO Unit: ${line.unit}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
