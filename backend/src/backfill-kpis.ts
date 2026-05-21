import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const companies = await prisma.company.findMany();
        console.log('Found companies:', companies.map(c => c.name));
        
        for (const company of companies) {
            console.log(`Calculating KPIs for: ${company.name} (${company.id})`);
            const companyId = company.id;

            // 1. total_sales
            const salesResult = await prisma.$queryRaw<Array<{ count: number }>>`
                SELECT COUNT(*)::int as count 
                FROM sales_orders 
                WHERE company_id = ${companyId}::uuid AND status != 'CANCELLED'
            `;
            const totalSales = Number(salesResult[0]?.count || 0);

            // 2. revenue
            const revResult = await prisma.$queryRaw<Array<{ revenue: number }>>`
                SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
                FROM invoices 
                WHERE company_id = ${companyId}::uuid 
                  AND status IN ('PAID', 'PARTIAL', 'SENT', 'OVERDUE')
            `;
            const revenue = Number(revResult[0]?.revenue || 0);

            // 3. revenue_today
            const revTodayResult = await prisma.$queryRaw<Array<{ revenue: number }>>`
                SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
                FROM invoices 
                WHERE company_id = ${companyId}::uuid 
                  AND date >= CURRENT_DATE
            `;
            const revenueToday = Number(revTodayResult[0]?.revenue || 0);

            // 4. revenue_month
            const revMonthResult = await prisma.$queryRaw<Array<{ revenue: number }>>`
                SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
                FROM invoices 
                WHERE company_id = ${companyId}::uuid 
                  AND date >= DATE_TRUNC('month', CURRENT_DATE)
                  AND status IN ('PAID', 'PARTIAL', 'SENT', 'OVERDUE')
            `;
            const revenueMonth = Number(revMonthResult[0]?.revenue || 0);

            // 5. cash_flow
            const cashFlowResult = await prisma.$queryRaw<Array<{ cash_flow: number }>>`
                SELECT (
                  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE company_id = ${companyId}::uuid) -
                  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = ${companyId}::uuid)
                )::float as cash_flow
            `;
            const cashFlow = Number(cashFlowResult[0]?.cash_flow || 0);

            // 6. profitability
            const cogsResult = await prisma.$queryRaw<Array<{ cogs: number }>>`
                SELECT COALESCE(SUM(sol.unit_cost_snapshot * sol.quantity), 0)::float as cogs
                FROM sales_order_lines sol
                JOIN sales_orders so ON sol.sales_order_id = so.id
                WHERE so.company_id = ${companyId}::uuid 
                  AND so.status IN ('SHIPPED', 'INVOICED')
            `;
            const cogs = Number(cogsResult[0]?.cogs || 0);
            const profitability = revenue === 0 ? 0 : ((revenue - cogs) / revenue) * 100;

            // 7. collected_revenue
            const collectedResult = await prisma.$queryRaw<Array<{ collected: number }>>`
                SELECT COALESCE(SUM(amount_paid), 0)::float as collected
                FROM invoices
                WHERE company_id = ${companyId}::uuid
                  AND status NOT IN ('CANCELLED')
            `;
            const collectedRevenue = Number(collectedResult[0]?.collected || 0);

            // 8. recovery_rate
            const recoveryRate = revenue === 0 ? 0 : (collectedRevenue / revenue) * 100;

            // Log calculations
            console.log(`- Sales: ${totalSales}`);
            console.log(`- Revenue: ${revenue}`);
            console.log(`- Cash Flow (Trésorerie): ${cashFlow}`);
            console.log(`- COGS: ${cogs}`);
            console.log(`- Profitability: ${profitability.toFixed(2)}%`);
            console.log(`- Collected Revenue (Encaissé): ${collectedRevenue}`);
            console.log(`- Recovery Rate: ${recoveryRate.toFixed(2)}%`);

            const kpis = {
                total_sales: { value: totalSales },
                revenue: { value: revenue },
                revenue_today: { value: revenueToday },
                revenue_month: { value: revenueMonth },
                cash_flow: { value: cashFlow },
                profitability: { value: profitability },
                collected_revenue: { value: collectedRevenue },
                recovery_rate: { value: recoveryRate }
            };

            for (const [metric, data] of Object.entries(kpis)) {
                await prisma.companyKpi.upsert({
                    where: { companyId_metric: { companyId, metric } },
                    update: { value: data.value, updatedAt: new Date() },
                    create: { companyId, metric, value: data.value }
                });
            }
        }
        console.log('KPI backfill completed successfully!');
    } catch (e) {
        console.error('Failed to run KPI backfill:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
