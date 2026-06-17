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
