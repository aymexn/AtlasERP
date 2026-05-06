"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const analytics_controller_1 = require("./analytics.controller");
const abc_classification_service_1 = require("./services/abc-classification.service");
const stock_turnover_service_1 = require("./services/stock-turnover.service");
const dead_stock_service_1 = require("./services/dead-stock.service");
const reorder_point_service_1 = require("./services/reorder-point.service");
const supplier_performance_service_1 = require("./services/supplier-performance.service");
const analytics_cron_service_1 = require("./services/analytics-cron.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [
            abc_classification_service_1.AbcClassificationService,
            stock_turnover_service_1.StockTurnoverService,
            dead_stock_service_1.DeadStockService,
            reorder_point_service_1.ReorderPointService,
            supplier_performance_service_1.SupplierPerformanceService,
            analytics_cron_service_1.AnalyticsCronService,
        ],
        exports: [
            abc_classification_service_1.AbcClassificationService,
            stock_turnover_service_1.StockTurnoverService,
            dead_stock_service_1.DeadStockService,
            reorder_point_service_1.ReorderPointService,
            supplier_performance_service_1.SupplierPerformanceService,
        ],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map