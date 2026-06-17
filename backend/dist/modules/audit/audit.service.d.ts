import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: {
        companyId: string;
        userId?: string;
        action: string;
        entity: string;
        entityId: string;
        oldValues?: any;
        newValues?: any;
        metadata?: any;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entity: string;
        entityId: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
    }>;
    findAll(companyId: string, filters?: {
        entity?: string;
        userId?: string;
        limit?: number;
    }): Promise<({
        user: {
            email: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entity: string;
        entityId: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
    })[]>;
}
