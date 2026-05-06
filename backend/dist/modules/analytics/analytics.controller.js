"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const abc_classification_service_1 = require("./services/abc-classification.service");
const stock_turnover_service_1 = require("./services/stock-turnover.service");
const dead_stock_service_1 = require("./services/dead-stock.service");
const reorder_point_service_1 = require("./services/reorder-point.service");
const supplier_performance_service_1 = require("./services/supplier-performance.service");
let AnalyticsController = class AnalyticsController {
    constructor(abcService, turnoverService, deadStockService, reorderService, supplierService) {
        this.abcService = abcService;
        this.turnoverService = turnoverService;
        this.deadStockService = deadStockService;
        this.reorderService = reorderService;
        this.supplierService = supplierService;
    }
    async calculateAbc(req, body) {
        return this.abcService.calculateABC(req.user.companyId, new Date(body.startDate), new Date(body.endDate));
    }
    async getAbcSummary(req) {
        return this.abcService.getSummary(req.user.companyId);
    }
    async getAbcProducts(req, classification, limit) {
        return this.abcService.getProductsByClassification(req.user.companyId, classification, limit);
    }
    async identifyDeadStock(req, body) {
        return this.deadStockService.identifyDeadStock(req.user.companyId, body.daysThreshold);
    }
    async getDeadStockReport(req, category) {
        const items = await this.deadStockService.getReport(req.user.companyId, category);
        const summary = {
            totalItems: items.length,
            totalValue: items.reduce((sum, item) => sum + Number(item.stockValue), 0),
            byCategory: {
                slowMoving: items.filter(i => i.category === 'slow_moving').length,
                deadStock: items.filter(i => i.category === 'dead_stock').length,
                obsolete: items.filter(i => i.category === 'obsolete').length
            }
        };
        return { items, summary };
    }
    async markDeadStockAction(req, id, body) {
        return this.deadStockService.markAction(id, body.action, req.user.id);
    }
    async getReorderAlerts(req) {
        return this.reorderService.getAlerts(req.user.companyId);
    }
    async calculateReorderPoint(req, productId, body) {
        return this.reorderService.calculateReorderPoint(req.user.companyId, productId, body.warehouseId || null, body.serviceLevel);
    }
    async getSupplierRankings(req, startDate, endDate) {
        return this.supplierService.getRankings(req.user.companyId, new Date(startDate), new Date(endDate));
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('abc/calculate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "calculateAbc", null);
__decorate([
    (0, common_1.Get)('abc/summary'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAbcSummary", null);
__decorate([
    (0, common_1.Get)('abc/products/:classification'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('classification')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAbcProducts", null);
__decorate([
    (0, common_1.Post)('dead-stock/identify'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "identifyDeadStock", null);
__decorate([
    (0, common_1.Get)('dead-stock'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDeadStockReport", null);
__decorate([
    (0, common_1.Post)('dead-stock/:id/action'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "markDeadStockAction", null);
__decorate([
    (0, common_1.Get)('reorder-points/alerts'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getReorderAlerts", null);
__decorate([
    (0, common_1.Post)('reorder-points/calculate/:productId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "calculateReorderPoint", null);
__decorate([
    (0, common_1.Get)('supplier-performance/rankings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSupplierRankings", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [abc_classification_service_1.AbcClassificationService,
        stock_turnover_service_1.StockTurnoverService,
        dead_stock_service_1.DeadStockService,
        reorder_point_service_1.ReorderPointService,
        supplier_performance_service_1.SupplierPerformanceService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map