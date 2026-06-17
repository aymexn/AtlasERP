const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9'; // Cameleon Colors
  const treasuryHistory = [];
  const monthsFr = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    const paymentsSum = await prisma.payment.aggregate({
      where: {
        companyId,
        date: { lte: endOfMonth }
      },
      _sum: { amount: true }
    });
    
    const expensesSum = await prisma.expense.aggregate({
      where: {
        companyId,
        date: { lte: endOfMonth }
      },
      _sum: { amount: true }
    });
    
    const receivedVal = Number(paymentsSum._sum.amount || 0);
    const spentVal = Number(expensesSum._sum.amount || 0);
    const balance = receivedVal - spentVal;
    
    const label = `${monthsFr[month]} ${year}`;
    treasuryHistory.push({
      date: label,
      balance
    });
  }
  
  console.log('Treasury History over 6 months:', treasuryHistory);
}

main().catch(console.error).finally(() => prisma.$disconnect());
