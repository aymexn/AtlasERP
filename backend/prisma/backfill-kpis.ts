import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KpiService } from '../src/modules/dashboard/services/kpi.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

async function backfill() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const kpiService = app.get(KpiService);
    const prisma = app.get(PrismaService);

    console.log('🚀 Starting KPI Backfill...');

    const companies = await prisma.company.findMany({
        select: { id: true, name: true }
    });

    console.log(`📊 Found ${companies.length} companies to process.`);

    const allMetrics = [
        'total_sales', 'revenue', 'cash_flow', 'inventory_value', 
        'stock_alerts', 'active_purchase_orders', 'total_receptions', 
        'validated_receptions', 'pending_receptions', 'active_employees', 
        'pending_leaves', 'profitability', 'revenue_today', 'revenue_month'
    ];

    for (const company of companies) {
        try {
            console.log(`🔄 Processing [${company.name}] (${company.id})...`);
            await kpiService.recalculate(company.id, allMetrics);
            console.log(`✅ Success for ${company.name}`);
        } catch (error) {
            console.error(`❌ Failed for ${company.name}:`, error.message);
        }
    }

    console.log('✨ Backfill complete!');
    await app.close();
}

backfill().catch(err => {
    console.error('💥 Fatal error during backfill:', err);
    process.exit(1);
});
