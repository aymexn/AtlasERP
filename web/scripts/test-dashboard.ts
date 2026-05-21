import { DashboardService } from '../src/services/dashboard.service';
import { prisma } from '../src/lib/prisma';

async function main() {
    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            console.log("No company found");
            return;
        }
        console.log(`Using company: ${company.id}`);

        const service = new DashboardService();

        const tests = [
            'getOverviewStats',
            'getFinancialStats',
            'getProductionStats',
            'getHRStats',
            'getLogisticsStats',
            'getSalesStats',
            'getRecentActivity',
            'getDetailedKpis',
            'getSalesOrderKpis'
        ];

        for (const test of tests) {
            console.log(`\nTesting ${test}()...`);
            try {
                // @ts-ignore
                const result = await service[test](company.id);
                console.log("SUCCESS");
            } catch (error) {
                console.error(`FAILED:`, error);
            }
        }
    } catch (error) {
        console.error("Main Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
