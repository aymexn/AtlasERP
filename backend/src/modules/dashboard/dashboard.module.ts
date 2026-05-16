import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { KpiService } from './services/kpi.service';

@Module({
    controllers: [DashboardController],
    providers: [DashboardService, KpiService],
    exports: [DashboardService, KpiService]
})
export class DashboardModule { }
