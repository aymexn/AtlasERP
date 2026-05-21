import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        companyId: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
    }>;
    create(data: {
        email: string;
        passwordHash: string;
        companyId?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        companyId: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
    }>;
    updateCompany(userId: string, companyId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        companyId: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
    }>;
    findAll(): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        email: string;
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                displayName: string;
                isSystemRole: boolean;
            };
        } & {
            id: string;
            isActive: boolean;
            userId: string;
            assignedAt: Date;
            assignedBy: string | null;
            expiresAt: Date | null;
            roleId: string;
        })[];
    }[]>;
    invite(email: string, roleId: string, invitedBy: string, companyId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        companyId: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
    }>;
}
