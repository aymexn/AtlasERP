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
exports.LeavesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../rbac/guards/permissions.guard");
const rbac_decorator_1 = require("../../rbac/decorators/rbac.decorator");
const leaves_service_1 = require("./leaves.service");
let LeavesController = class LeavesController {
    constructor(leavesService) {
        this.leavesService = leavesService;
    }
    async getLeaveTypes(req) {
        return this.leavesService.getLeaveTypes(req.user.companyId);
    }
    async createLeaveType(req, data) {
        return this.leavesService.createLeaveType(req.user.companyId, data);
    }
    async getBalances(employeeId, year) {
        return this.leavesService.getBalances(employeeId, year ? parseInt(year) : undefined);
    }
    async requestLeave(req, data) {
        const employeeId = data.employeeId || req.user.employeeId;
        return this.leavesService.requestLeave(req.user.companyId, employeeId, data);
    }
    async findAll(req, filters) {
        return this.leavesService.findAll(req.user.companyId, filters);
    }
    async approveByManager(req, id, comment) {
        return this.leavesService.approveByManager(req.user.companyId, id, req.user.employeeId, comment);
    }
    async approveByHr(req, id, comment) {
        return this.leavesService.approveByHr(req.user.companyId, id, req.user.employeeId, comment);
    }
    async reject(req, id, comment) {
        return this.leavesService.reject(req.user.companyId, id, req.user.id, comment);
    }
    async getCalendar(req, start, end) {
        return this.leavesService.getCalendar(req.user.companyId, new Date(start), new Date(end));
    }
};
exports.LeavesController = LeavesController;
__decorate([
    (0, common_1.Get)('types'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'read'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "getLeaveTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'manage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "createLeaveType", null);
__decorate([
    (0, common_1.Get)('balance/:employeeId'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'read'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "requestLeave", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'read'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('requests/:id/approve-manager'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'approve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "approveByManager", null);
__decorate([
    (0, common_1.Patch)('requests/:id/approve-hr'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'manage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "approveByHr", null);
__decorate([
    (0, common_1.Patch)('requests/:id/reject'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'approve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'leaves', 'read'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "getCalendar", null);
exports.LeavesController = LeavesController = __decorate([
    (0, common_1.Controller)('hr/leaves'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [leaves_service_1.LeavesService])
], LeavesController);
//# sourceMappingURL=leaves.controller.js.map