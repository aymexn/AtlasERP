import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        invitationToken: string | null;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        invitationExpires: Date | null;
        companyRoleId: string | null;
    }>;
    create(data: {
        email: string;
        passwordHash: string;
        companyId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        invitationToken: string | null;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        invitationExpires: Date | null;
        companyRoleId: string | null;
    }>;
    updateCompany(userId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        invitationToken: string | null;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        invitationExpires: Date | null;
        companyRoleId: string | null;
    }>;
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
    invite(email: string, roleId: string, invitedBy: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        invitationToken: string | null;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        invitationExpires: Date | null;
        companyRoleId: string | null;
    }>;
}
