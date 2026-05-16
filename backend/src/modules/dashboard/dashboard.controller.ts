import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { KpiService } from './services/kpi.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(
        private dashboardService: DashboardService,
        private kpiService: KpiService,
        private prisma: PrismaService
    ) { }

    @Get('kpis')
    async getKpi(@Request() req) {
        const companyId = req.user.companyId;
        const kpis = await this.kpiService.getAll(companyId);
        
        // If no KPIs exist, trigger an initial recalculation
        if (Object.keys(kpis).length === 0) {
            const allMetrics = [
                'total_sales', 'revenue', 'cash_flow', 'inventory_value', 
                'stock_alerts', 'active_purchase_orders', 'total_receptions', 
                'validated_receptions', 'pending_receptions', 'active_employees', 
                'pending_leaves', 'profitability', 'revenue_today', 'revenue_month'
            ];
            await this.kpiService.recalculate(companyId, allMetrics);
            return await this.kpiService.getAll(companyId);
        }
        
        return kpis;
    }

    @Post('refresh')
    async refreshKpi(@Request() req) {
        const allMetrics = [
            'total_sales', 'revenue', 'cash_flow', 'inventory_value', 
            'stock_alerts', 'active_purchase_orders', 'total_receptions', 
            'validated_receptions', 'pending_receptions', 'active_employees', 
            'pending_leaves', 'profitability', 'revenue_today', 'revenue_month'
        ];
        await this.kpiService.recalculate(req.user.companyId, allMetrics);
        return { success: true };
    }
}
