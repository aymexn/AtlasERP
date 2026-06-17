const { DashboardService } = require('../src/services/dashboard.service');
const service = new DashboardService();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  console.log('Testing reverted getFinancialStats...');
  const fin = await service.getFinancialStats(companyId);
  console.log('Financial Stats:', fin);

  console.log('Testing reverted getOverviewStats...');
  const over = await service.getOverviewStats(companyId);
  console.log('Overview Stats:', over);
}

main().catch(e => console.error(e));
