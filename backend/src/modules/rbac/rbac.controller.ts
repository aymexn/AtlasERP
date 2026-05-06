import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckPermission } from './decorators/rbac.decorator';
import { PermissionsGuard } from './guards/permissions.guard';

@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions/me')
  async getMyPermissions(@Request() req) {
    return this.rbacService.getUserPermissions(req.user.id);
  }

  @Get('permissions')
  @CheckPermission('roles', 'role', 'read')
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Get('roles')
  @CheckPermission('roles', 'role', 'read')
  async getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  @Post('roles/:roleId/permissions')
  @CheckPermission('roles', 'role', 'update')
  async updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body('permissionIds') permissionIds: string | string[],
    @Request() req
  ) {
    if (Array.isArray(permissionIds)) {
      return this.rbacService.updateRolePermissions(roleId, permissionIds, req.user.id);
    } else {
      return this.rbacService.addPermissionToRole(roleId, permissionIds, req.user.id);
    }
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @CheckPermission('roles', 'role', 'update')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Request() req
  ) {
    return this.rbacService.removePermissionFromRole(roleId, permissionId, req.user.id);
  }

  @Post('users/:userId/roles')
  @CheckPermission('users', 'user', 'assign_roles')
  async assignRole(
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
    @Body('expiresAt') expiresAt: string,
    @Request() req
  ) {
    return this.rbacService.assignRole(
      userId,
      roleId,
      req.user.id,
      expiresAt ? new Date(expiresAt) : null
    );
  }

  @Delete('users/:userId/roles/:roleId')
  @CheckPermission('users', 'user', 'assign_roles')
  async revokeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req
  ) {
    return this.rbacService.revokeRole(userId, roleId, req.user.id);
  }
}
