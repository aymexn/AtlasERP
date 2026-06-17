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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const dashboard_service_1 = require("./dashboard.service");
const kpi_service_1 = require("./services/kpi.service");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardController = class DashboardController {
    constructor(dashboardService, kpiService, prisma) {
        this.dashboardService = dashboardService;
        this.kpiService = kpiService;
        this.prisma = prisma;
    }
    async getKpi(req) {
        const companyId = req.user.companyId;
        const kpis = await this.kpiService.getAll(companyId);
        if (Object.keys(kpis).length === 0) {
            await this.kpiService.refreshAllKpisForCompany(companyId);
            return await this.kpiService.getAll(companyId);
        }
        return kpis;
    }
    async refreshKpi(req) {
        await this.kpiService.refreshAllKpisForCompany(req.user.companyId);
        return { success: true };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getKpi", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "refreshKpi", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        kpi_service_1.KpiService,
        prisma_service_1.PrismaService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map