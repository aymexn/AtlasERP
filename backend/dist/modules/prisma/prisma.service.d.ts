import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
export declare const tenantContext: AsyncLocalStorage<{
    tenantId: string;
}>;
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    constructor();
    onModuleInit(): Promise<void>;
    private tenancyMiddleware;
}
