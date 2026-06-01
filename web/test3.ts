import { prisma } from './src/lib/prisma';
import { DashboardService } from './src/services/dashboard.service';

async function debug() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('No company found');
    return;
  }
  const companyId = company.id;
  console.log('Company ID:', companyId);

  const logs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Recent Audit Logs:', JSON.stringify(logs, null, 2));

  const service = new DashboardService();
  const recentActivity = await service.getRecentActivity(companyId);
  console.log('Service getRecentActivity output:', JSON.stringify(recentActivity, null, 2));
}

debug().catch(console.error).finally(() => prisma.$disconnect());

