import { DashboardService } from '../src/services/dashboard.service';

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9'; // Cameleon Colors
  const service = new DashboardService();
  const res = await service.getFinancialStats(companyId);
  console.log('Result from getFinancialStats:', res);
}

main().catch(console.error);
