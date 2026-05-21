import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { KpiService } from './services/kpi.service';
import { DashboardGateway } from './gateways/dashboard.gateway';

@Module({
    controllers: [DashboardController],
    providers: [DashboardService, KpiService, DashboardGateway],
    exports: [DashboardService, KpiService, DashboardGateway]
})
export class DashboardModule { }
