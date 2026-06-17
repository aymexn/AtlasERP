import { prisma } from '../src/lib/prisma';

async function main() {
  const companies = await prisma.company.findMany();
  console.log('COMPANIES:');
  for (const c of companies) {
    console.log(`- ${c.name} (${c.id})`);
  }

  const cameleon = companies.find(c => c.name.includes('Cameleon'));
  if (!cameleon) {
    console.log('Cameleon Colors not found!');
    return;
  }

  const companyId = cameleon.id;

  const invoiceCount = await prisma.invoice.count({ where: { companyId } });
  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log(`\nTOTAL INVOICES for Cameleon: ${invoiceCount}`);
  for (const inv of invoices) {
    console.log(`- Ref: ${inv.reference}, Date: ${inv.date.toISOString()}, Total TTC: ${inv.totalAmountTtc}, Status: ${inv.status}`);
  }

  const orderCount = await prisma.salesOrder.count({ where: { companyId } });
  const orders = await prisma.salesOrder.findMany({
    where: { companyId },
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log(`\nTOTAL SALES ORDERS for Cameleon: ${orderCount}`);
  for (const o of orders) {
    console.log(`- Ref: ${o.reference}, Date: ${o.date.toISOString()}, Total TTC: ${o.totalAmountTtc}, Status: ${o.status}`);
  }

  const paymentCount = await prisma.payment.count({ where: { companyId } });
  const payments = await prisma.payment.findMany({
    where: { companyId },
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log(`\nTOTAL PAYMENTS for Cameleon: ${paymentCount}`);
  for (const p of payments) {
    console.log(`- Date: ${p.date.toISOString()}, Amount: ${p.amount}`);
  }

  const moCount = await prisma.manufacturingOrder.count({ where: { companyId } });
  console.log(`\nTOTAL MANUFACTURING ORDERS: ${moCount}`);
}

main().catch(console.error);
