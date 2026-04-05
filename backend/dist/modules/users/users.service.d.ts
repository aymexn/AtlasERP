import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
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
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        companyId: string;
        createdAt: Date;
    }>;
    updateCompany(userId: string, companyId: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        companyId: string;
        createdAt: Date;
    }>;
}
