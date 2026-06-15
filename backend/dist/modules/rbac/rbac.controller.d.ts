import { RbacService } from './rbac.service';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
    getMyPermissions(req: any): Promise<{
        roles: {
            id: string;
            name: string;
            displayName: string;
        }[];
        permissions: any[];
        grouped: Record<string, Record<string, string[]>>;
    }>;
    getAllPermissions(): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        module: string;
        resource: string;
        action: string;
    }[]>;
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
    updateRolePermissions(roleId: string, permissionIds: string | string[], req: any): Promise<{
        id: string;
        roleId: string;
        permissionId: string;
        grantedAt: Date;
        grantedBy: string | null;
    } | {
        success: boolean;
    }>;
    removePermissionFromRole(roleId: string, permissionId: string, req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    assignRole(userId: string, roleId: string, expiresAt: string, req: any): Promise<{
        id: string;
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        isActive: boolean;
    }>;
    revokeRole(userId: string, roleId: string, req: any): Promise<{
        id: string;
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        isActive: boolean;
    }>;
}
