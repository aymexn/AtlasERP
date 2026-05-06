import { PrismaService } from '../prisma/prisma.service';
export declare class RbacService {
    private prisma;
    constructor(prisma: PrismaService);
    checkPermission(userId: string, module: string, resource: string, action: string): Promise<boolean>;
    getUserPermissions(userId: string): Promise<{
        roles: {
            id: string;
            name: string;
            displayName: string;
        }[];
        permissions: any[];
        grouped: Record<string, Record<string, string[]>>;
    }>;
    getAllRoles(): Promise<({
        permissions: ({
            permission: {
                id: string;
                createdAt: Date;
                action: string;
                description: string | null;
                module: string;
                resource: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
            grantedAt: Date;
            grantedBy: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        displayName: string;
        isSystemRole: boolean;
        updatedAt: Date;
    })[]>;
    getAllPermissions(): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        description: string | null;
        module: string;
        resource: string;
    }[]>;
    updateRolePermissions(roleId: string, permissionIds: string[], updatedBy: string): Promise<{
        success: boolean;
    }>;
    addPermissionToRole(roleId: string, permissionId: string, updatedBy: string): Promise<{
        id: string;
        roleId: string;
        permissionId: string;
        grantedAt: Date;
        grantedBy: string | null;
    }>;
    removePermissionFromRole(roleId: string, permissionId: string, updatedBy: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: Date): Promise<{
        id: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        isActive: boolean;
        userId: string;
        roleId: string;
    }>;
    revokeRole(userId: string, roleId: string, revokedBy: string): Promise<{
        id: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        isActive: boolean;
        userId: string;
        roleId: string;
    }>;
    logAccess(data: {
        userId: string;
        actionType: string;
        module?: string;
        resource?: string;
        action?: string;
        ipAddress?: string;
        userAgent?: string;
        details?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        roleId: string | null;
        actionType: string;
        resourceType: string | null;
        resourceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        permissionId: string | null;
        targetUserId: string | null;
    }>;
}
