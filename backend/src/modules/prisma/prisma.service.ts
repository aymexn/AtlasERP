import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super();
        this.$use(this.tenancyMiddleware());
    }

    async onModuleInit() {
        await this.$connect();
    }

    private tenancyMiddleware(): Prisma.Middleware {
        return async (params, next) => {
            const context = tenantContext.getStore();
            const tenantId = context?.tenantId;

            // List of models that have companyId and should be isolated
            const TENANT_MODELS = [
                'Product', 'ProductFamily', 'Warehouse', 'ProductStock', 'BillOfMaterials',
                'StockMovement', 'Customer', 'SalesOrder', 'Invoice', 'Payment', 'Expense',
                'AuditLog', 'ManufacturingOrder', 'Supplier', 'PurchaseOrder', 'StockReception',
                'CollectionActivity', 'Employee', 'HrDocument', 'PayrollPeriod',
                'PayrollRun', 'Project', 'CalendarEvent', 'CollaborationDocument', 'ApprovalRequest',
                'ActivityFeed', 'Notification', 'User'
            ];

            if (tenantId && params.model && TENANT_MODELS.includes(params.model)) {
                // For read queries
                if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
                    params.args.where = { ...params.args.where, companyId: tenantId };
                }
                
                // For creation
                if (params.action === 'create') {
                    params.args.data = { ...params.args.data, companyId: tenantId };
                }
                if (params.action === 'createMany') {
                    if (Array.isArray(params.args.data)) {
                        params.args.data = params.args.data.map((d: any) => ({ ...d, companyId: tenantId }));
                    } else {
                        params.args.data.data = params.args.data.data.map((d: any) => ({ ...d, companyId: tenantId }));
                    }
                }

                // For updates and deletions
                if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
                    params.args.where = { ...params.args.where, companyId: tenantId };
                }
            }

            return next(params);
        };
    }
}
