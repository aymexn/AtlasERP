import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        roles: ({
            role: {
                id: string;
                name: string;
                displayName: string;
                description: string | null;
                isSystemRole: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
            roleId: string;
            assignedAt: Date;
            assignedBy: string | null;
            expiresAt: Date | null;
            isActive: boolean;
        })[];
        email: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }[]>;
    invite(body: {
        email: string;
        roleId: string;
    }, req: any): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        name: string | null;
        createdAt: Date;
        email: string;
        passwordHash: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        invitationToken: string | null;
        invitationExpires: Date | null;
        companyRoleId: string | null;
    }>;
}
