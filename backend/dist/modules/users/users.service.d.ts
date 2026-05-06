import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        createdAt: Date;
    }>;
    create(data: {
        email: string;
        passwordHash: string;
        companyId?: string;
    }): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        createdAt: Date;
    }>;
    updateCompany(userId: string, companyId: string): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        createdAt: Date;
    }>;
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
    invite(email: string, roleId: string, invitedBy: string, companyId: string): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        companyId: string;
        createdAt: Date;
    }>;
}
