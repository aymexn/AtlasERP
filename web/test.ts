import { prisma } from './src/lib/prisma';

async function debug() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    take: 1
  });
  const companyId = purchaseOrders.length > 0 ? purchaseOrders[0].companyId : null;
  
  if (!companyId) {
    console.log('No company found with purchase orders');
    return;
  }
  
  console.log('Using CompanyId:', companyId);
  
  const purchaseOrdersCount = await prisma.purchaseOrder.count({
    where: { companyId }
  });
  console.log('Total Purchase Orders:', purchaseOrdersCount);
  
  const totalCost = await prisma.purchaseOrder.aggregate({
    where: { companyId },
    _sum: { totalHt: true, totalTtc: true }
  });
  console.log('Total Cost:', totalCost._sum.totalTtc || totalCost._sum.totalHt);
  
  const stockAlerts = await prisma.productStock.count({
    where: {
      product: { companyId },
      quantity: { lte: 0 }
    }
  });
  console.log('Stock Alerts:', stockAlerts);
}

debug().catch(console.error).finally(() => prisma.$disconnect());
