import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                description: string | null;
                displayName: string;
                isSystemRole: boolean;
                updatedAt: Date;
            };
        } & {
            id: string;
            assignedAt: Date;
            assignedBy: string | null;
            expiresAt: Date | null;
            isActive: boolean;
            userId: string;
            roleId: string;
        })[];
    }[]>;
    invite(body: {
        email: string;
        roleId: string;
    }, req: any): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        createdAt: Date;
    }>;
}
