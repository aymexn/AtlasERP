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
exports.PerformanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../rbac/guards/permissions.guard");
const rbac_decorator_1 = require("../../rbac/decorators/rbac.decorator");
const performance_service_1 = require("./performance.service");
let PerformanceController = class PerformanceController {
    constructor(performanceService) {
        this.performanceService = performanceService;
    }
    async getCycles(req) {
        return this.performanceService.getCycles(req.user.companyId);
    }
    async createCycle(req, data) {
        return this.performanceService.createCycle(req.user.companyId, data);
    }
    async initializeReviews(id) {
        return this.performanceService.initializeReviews(id);
    }
    async getReviews(id) {
        return this.performanceService.getReviews(id);
    }
    async updateSelfReview(id, data) {
        return this.performanceService.updateSelfReview(id, data);
    }
    async updateManagerReview(id, data) {
        return this.performanceService.updateManagerReview(id, data);
    }
    async createObjective(id, data) {
        return this.performanceService.createObjective(id, data);
    }
    async getEmployeeHistory(id) {
        return this.performanceService.getEmployeeHistory(id);
    }
};
exports.PerformanceController = PerformanceController;
__decorate([
    (0, common_1.Get)('cycles'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'read'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "getCycles", null);
__decorate([
    (0, common_1.Post)('cycles'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'manage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "createCycle", null);
__decorate([
    (0, common_1.Post)('cycles/:id/initialize'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "initializeReviews", null);
__decorate([
    (0, common_1.Get)('cycles/:id/reviews'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Put)('reviews/:id/self'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "updateSelfReview", null);
__decorate([
    (0, common_1.Put)('reviews/:id/manager'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "updateManagerReview", null);
__decorate([
    (0, common_1.Post)('reviews/:id/objectives'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "createObjective", null);
__decorate([
    (0, common_1.Get)('employees/:id/history'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'performance', 'read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "getEmployeeHistory", null);
exports.PerformanceController = PerformanceController = __decorate([
    (0, common_1.Controller)('hr/performance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [performance_service_1.PerformanceService])
], PerformanceController);
//# sourceMappingURL=performance.controller.js.map