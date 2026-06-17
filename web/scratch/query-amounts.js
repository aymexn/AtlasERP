const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  
  const paymentSumObj = await prisma.payment.aggregate({
    where: { companyId },
    _sum: { amount: true }
  });
  console.log('PAYMENTS SUM:', paymentSumObj._sum.amount);
  
  const expenseSumObj = await prisma.expense.aggregate({
    where: { companyId },
    _sum: { amount: true }
  });
  console.log('EXPENSES SUM:', expenseSumObj._sum.amount);
  
  const invoicePaidSumObj = await prisma.invoice.aggregate({
    where: { companyId },
    _sum: { amountPaid: true, totalAmountTtc: true, amountRemaining: true }
  });
  console.log('INVOICES totalAmountTtc SUM:', invoicePaidSumObj._sum.totalAmountTtc);
  console.log('INVOICES amountPaid SUM:', invoicePaidSumObj._sum.amountPaid);
  console.log('INVOICES amountRemaining SUM:', invoicePaidSumObj._sum.amountRemaining);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
