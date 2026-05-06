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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RbacService = class RbacService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkPermission(userId, module, resource, action) {
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
            const hasPerm = userRole.role.permissions.some(rp => rp.permission.module === module &&
                rp.permission.resource === resource &&
                rp.permission.action === action);
            if (hasPerm)
                return true;
        }
        return false;
    }
    async getUserPermissions(userId) {
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
        const permissions = new Set();
        const detailed = [];
        const grouped = {};
        for (const userRole of userRoles) {
            for (const rp of userRole.role.permissions) {
                const p = rp.permission;
                const key = `${p.module}:${p.resource}:${p.action}`;
                if (!permissions.has(key)) {
                    permissions.add(key);
                    detailed.push(p);
                    if (!grouped[p.module])
                        grouped[p.module] = {};
                    if (!grouped[p.module][p.resource])
                        grouped[p.module][p.resource] = [];
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
    async getAllPermissions() {
        return this.prisma.appPermission.findMany();
    }
    async updateRolePermissions(roleId, permissionIds, updatedBy) {
        return this.prisma.$transaction(async (tx) => {
            await tx.permissionAuditLog.create({
                data: {
                    userId: updatedBy,
                    actionType: 'role_permissions_updated',
                    roleId,
                    details: { permissionCount: permissionIds.length },
                },
            });
            await tx.rolePermission.deleteMany({
                where: { roleId },
            });
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
    async addPermissionToRole(roleId, permissionId, updatedBy) {
        const role = await this.prisma.appRole.findUnique({ where: { id: roleId } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
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
    async removePermissionFromRole(roleId, permissionId, updatedBy) {
        const role = await this.prisma.appRole.findUnique({ where: { id: roleId } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const result = await this.prisma.rolePermission.deleteMany({
            where: { roleId, permissionId },
        });
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
    async assignRole(userId, roleId, assignedBy, expiresAt) {
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
    async revokeRole(userId, roleId, revokedBy) {
        return this.prisma.$transaction(async (tx) => {
            const userRole = await tx.userRole.update({
                where: {
                    userId_roleId: { userId, roleId },
                },
                data: {
                    isActive: false,
                },
            });
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
    async logAccess(data) {
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
            if (p)
                permissionId = p.id;
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
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map