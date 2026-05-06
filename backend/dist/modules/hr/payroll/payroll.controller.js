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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../rbac/guards/permissions.guard");
const rbac_decorator_1 = require("../../rbac/decorators/rbac.decorator");
const payroll_service_1 = require("./payroll.service");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async getPeriods(req) {
        return this.payrollService.getPeriods(req.user.companyId);
    }
    async createPeriod(req, data) {
        return this.payrollService.createPeriod(req.user.companyId, data);
    }
    async calculatePayroll(req, id) {
        return this.payrollService.calculatePayroll(req.user.companyId, id);
    }
    async getPayrollRuns(id) {
        return this.payrollService.getPayrollRuns(id);
    }
    async generatePayslip(id) {
        return this.payrollService.generatePayslip(id);
    }
    async getEmployeePayslips(id) {
        return this.payrollService.getPayslips(id);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('periods'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'payroll', 'read'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPeriods", null);
__decorate([
    (0, common_1.Post)('periods'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'payroll', 'create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createPeriod", null);
__decorate([
    (0, common_1.Post)('periods/:id/calculate'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'payroll', 'approve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "calculatePayroll", null);
__decorate([
    (0, common_1.Get)('periods/:id/runs'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'payroll', 'read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPayrollRuns", null);
__decorate([
    (0, common_1.Post)('runs/:id/payslip'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'payroll', 'approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "generatePayslip", null);
__decorate([
    (0, common_1.Get)('employees/:id/payslips'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'payroll', 'read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getEmployeePayslips", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('hr/payroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map