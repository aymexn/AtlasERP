import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, module: string, resource: string, action: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    for (const userRole of userRoles) {
      const hasPerm = userRole.role.permissions.some(
        rp => 
          rp.permission.module === module && 
          rp.permission.resource === resource && 
          rp.permission.action === action
      );
      if (hasPerm) return true;
    }

    return false;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    const detailed = [];
    const grouped: Record<string, Record<string, string[]>> = {};

    for (const userRole of userRoles) {
      for (const rp of userRole.role.permissions) {
        const p = rp.permission;
        const key = `${p.module}:${p.resource}:${p.action}`;
        
        if (!permissions.has(key)) {
          permissions.add(key);
          detailed.push(p);
          
          if (!grouped[p.module]) grouped[p.module] = {};
          if (!grouped[p.module][p.resource]) grouped[p.module][p.resource] = [];
          grouped[p.module][p.resource].push(p.action);
        }
      }
    }

    const roles = userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    }));

    return { roles, permissions: detailed, grouped };
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    return this.prisma.appRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return this.prisma.appPermission.findMany();
  }

  /**
   * Update permissions for a role
   */
  async updateRolePermissions(roleId: string, permissionIds: string[], updatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      // Audit Log
      await tx.permissionAuditLog.create({
        data: {
          userId: updatedBy,
          actionType: 'role_permissions_updated',
          roleId,
          details: { permissionCount: permissionIds.length },
        },
      });

      // 1. Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2. Add new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId,
            permissionId,
            grantedBy: updatedBy,
          })),
        });
      }

      return { success: true };
    });
  }

  /**
   * Add a single permission to a role
   */
  async addPermissionToRole(roleId: string, permissionId: string, updatedBy: string) {
    // Check if role exists
    const role = await this.prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const result = await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      update: {
        grantedBy: updatedBy,
      },
      create: {
        roleId,
        permissionId,
        grantedBy: updatedBy,
      },
    });

    // Audit Log
    await this.prisma.permissionAuditLog.create({
      data: {
        userId: updatedBy,
        actionType: 'permission_added',
        roleId,
        permissionId,
      },
    });

    return result;
  }

  /**
   * Remove a single permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string, updatedBy: string) {
    const role = await this.prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const result = await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });

    // Audit Log
    await this.prisma.permissionAuditLog.create({
      data: {
        userId: updatedBy,
        actionType: 'permission_removed',
        roleId,
        permissionId,
      },
    });

    return result;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: Date) {
    return this.prisma.$transaction(async (tx) => {
      const userRole = await tx.userRole.upsert({
        where: {
          userId_roleId: { userId, roleId },
        },
        update: {
          isActive: true,
          expiresAt: expiresAt || null,
          assignedBy,
        },
        create: {
          userId,
          roleId,
          isActive: true,
          expiresAt: expiresAt || null,
          assignedBy,
        },
      });

      // Audit Log
      await tx.permissionAuditLog.create({
        data: {
          userId: assignedBy,
          actionType: 'role_assigned',
          roleId,
          targetUserId: userId,
          details: { expiresAt },
        },
      });

      return userRole;
    });
  }

  /**
   * Revoke role from user
   */
  async revokeRole(userId: string, roleId: string, revokedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const userRole = await tx.userRole.update({
        where: {
          userId_roleId: { userId, roleId },
        },
        data: {
          isActive: false,
        },
      });

      // Audit Log
      await tx.permissionAuditLog.create({
        data: {
          userId: revokedBy,
          actionType: 'role_revoked',
          roleId,
          targetUserId: userId,
        },
      });

      return userRole;
    });
  }

  /**
   * Log access attempt
   */
  async logAccess(data: {
    userId: string;
    actionType: string;
    module?: string;
    resource?: string;
    action?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    // Find permission id if provided
    let permissionId = null;
    if (data.module && data.resource && data.action) {
      const p = await this.prisma.appPermission.findUnique({
        where: {
          module_resource_action: {
            module: data.module,
            resource: data.resource,
            action: data.action,
          }
        }
      });
      if (p) permissionId = p.id;
    }

    return this.prisma.permissionAuditLog.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        permissionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details,
      },
    });
  }
}
