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
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const rbac_decorator_1 = require("./decorators/rbac.decorator");
const permissions_guard_1 = require("./guards/permissions.guard");
let RbacController = class RbacController {
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    async getMyPermissions(req) {
        return this.rbacService.getUserPermissions(req.user.id);
    }
    async getAllPermissions() {
        return this.rbacService.getAllPermissions();
    }
    async getAllRoles() {
        return this.rbacService.getAllRoles();
    }
    async updateRolePermissions(roleId, permissionIds, req) {
        if (Array.isArray(permissionIds)) {
            return this.rbacService.updateRolePermissions(roleId, permissionIds, req.user.id);
        }
        else {
            return this.rbacService.addPermissionToRole(roleId, permissionIds, req.user.id);
        }
    }
    async removePermissionFromRole(roleId, permissionId, req) {
        return this.rbacService.removePermissionFromRole(roleId, permissionId, req.user.id);
    }
    async assignRole(userId, roleId, expiresAt, req) {
        return this.rbacService.assignRole(userId, roleId, req.user.id, expiresAt ? new Date(expiresAt) : null);
    }
    async revokeRole(userId, roleId, req) {
        return this.rbacService.revokeRole(userId, roleId, req.user.id);
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('permissions/me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getMyPermissions", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, rbac_decorator_1.CheckPermission)('roles', 'role', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getAllPermissions", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, rbac_decorator_1.CheckPermission)('roles', 'role', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getAllRoles", null);
__decorate([
    (0, common_1.Post)('roles/:roleId/permissions'),
    (0, rbac_decorator_1.CheckPermission)('roles', 'role', 'update'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)('permissionIds')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "updateRolePermissions", null);
__decorate([
    (0, common_1.Delete)('roles/:roleId/permissions/:permissionId'),
    (0, rbac_decorator_1.CheckPermission)('roles', 'role', 'update'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "removePermissionFromRole", null);
__decorate([
    (0, common_1.Post)('users/:userId/roles'),
    (0, rbac_decorator_1.CheckPermission)('users', 'user', 'assign_roles'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('roleId')),
    __param(2, (0, common_1.Body)('expiresAt')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('users/:userId/roles/:roleId'),
    (0, rbac_decorator_1.CheckPermission)('users', 'user', 'assign_roles'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "revokeRole", null);
exports.RbacController = RbacController = __decorate([
    (0, common_1.Controller)('rbac'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map