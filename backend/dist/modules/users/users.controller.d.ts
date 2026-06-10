import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        status: import(".prisma/client").$Enums.UserStatus;
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                description: string | null;
                updatedAt: Date;
                displayName: string;
                isSystemRole: boolean;
            };
        } & {
            id: string;
            userId: string;
            isActive: boolean;
            roleId: string;
            assignedAt: Date;
            assignedBy: string | null;
            expiresAt: Date | null;
        })[];
    }[]>;
    invite(body: {
        email: string;
        roleId: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        invitationToken: string | null;
        name: string | null;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        invitationExpires: Date | null;
        companyRoleId: string | null;
    }>;
}
