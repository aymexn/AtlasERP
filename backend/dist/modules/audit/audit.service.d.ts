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
        createdAt: Date;
        userId: string | null;
        companyId: string;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        entityId: string;
        action: string;
        entity: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
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
        createdAt: Date;
        userId: string | null;
        companyId: string;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        entityId: string;
        action: string;
        entity: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
