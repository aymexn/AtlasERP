import { prisma } from '../src/lib/prisma';

async function cleanData() {
  const cutoffDate = new Date('2026-03-01T00:00:00Z');
  console.log('Cleaning analytics and AI tables, removing records created before March 1, 2026...');

  try {
    // 1. Delete predictions
    const predictions = await prisma.aiPrediction.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${predictions.count} old AI predictions.`);

    // 2. Delete insights
    const insights = await prisma.aiInsight.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${insights.count} old AI insights.`);

    // 3. Delete chat histories
    const chatHistories = await prisma.aiChatHistory.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${chatHistories.count} old AI chat histories.`);

    // 4. Delete ABC Classifications
    const abc = await prisma.abcClassification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${abc.count} old ABC Classifications.`);

    // 5. Delete Turnover Analytics
    const turnover = await prisma.stockTurnoverAnalytics.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${turnover.count} old Stock Turnover Analytics.`);

    // 6. Delete Dead Stock Items
    const deadStock = await prisma.deadStockItem.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${deadStock.count} old Dead Stock Items.`);

    // 7. Delete Stock Movement Patterns
    const patterns = await prisma.stockMovementPattern.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${patterns.count} old Stock Movement Patterns.`);

    // 8. Clear Customer Analytics table
    const customerAnalytics = await prisma.customerAnalytics.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate }
      }
    });
    console.log(`Deleted ${customerAnalytics.count} old Customer Analytics records.`);

    // 9. Reset intelligence stats columns on Customer table
    const resetCustomers = await prisma.customer.updateMany({
      data: {
        segment: null,
        paymentBehavior: null,
        riskLevel: null,
        totalRevenue: 0,
        avgPaymentDelay: 0
      }
    });
    console.log(`Reset intelligence stats columns for ${resetCustomers.count} customers.`);

    console.log('Database cleanup finished successfully.');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

cleanData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
