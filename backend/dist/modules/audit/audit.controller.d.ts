import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(req: any, entity?: string, userId?: string, limit?: string): Promise<({
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
