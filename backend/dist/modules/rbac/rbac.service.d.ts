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
                description: string | null;
                createdAt: Date;
                module: string;
                resource: string;
                action: string;
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
        name: string;
        displayName: string;
        description: string | null;
        isSystemRole: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getAllPermissions(): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        module: string;
        resource: string;
        action: string;
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
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        isActive: boolean;
    }>;
    revokeRole(userId: string, roleId: string, revokedBy: string): Promise<{
        id: string;
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        isActive: boolean;
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
        userId: string | null;
        roleId: string | null;
        createdAt: Date;
        permissionId: string | null;
        actionType: string;
        resourceType: string | null;
        resourceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        targetUserId: string | null;
    }>;
}
