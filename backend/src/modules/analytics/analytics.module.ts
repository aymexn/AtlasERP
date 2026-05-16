import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AbcClassificationService } from './services/abc-classification.service';
import { StockTurnoverService } from './services/stock-turnover.service';
import { DeadStockService } from './services/dead-stock.service';
import { ReorderPointService } from './services/reorder-point.service';
import { SupplierPerformanceService } from './services/supplier-performance.service';
import { AnalyticsCronService } from './services/analytics-cron.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [
    AbcClassificationService,
    StockTurnoverService,
    DeadStockService,
    ReorderPointService,
    SupplierPerformanceService,
    AnalyticsCronService,
    DashboardAnalyticsService,
  ],
  exports: [
    AbcClassificationService,
    StockTurnoverService,
    DeadStockService,
    ReorderPointService,
    SupplierPerformanceService,
    DashboardAnalyticsService,
  ],
})
export class AnalyticsModule {}
