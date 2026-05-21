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
        createdAt: Date;
        description: string | null;
        action: string;
        module: string;
        resource: string;
    }[]>;
    getAllRoles(): Promise<({
        permissions: ({
            permission: {
                id: string;
                createdAt: Date;
                description: string | null;
                action: string;
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
        updatedAt: Date;
        name: string;
        description: string | null;
        displayName: string;
        isSystemRole: boolean;
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
        isActive: boolean;
        userId: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        roleId: string;
    }>;
    revokeRole(userId: string, roleId: string, req: any): Promise<{
        id: string;
        isActive: boolean;
        userId: string;
        assignedAt: Date;
        assignedBy: string | null;
        expiresAt: Date | null;
        roleId: string;
    }>;
}
