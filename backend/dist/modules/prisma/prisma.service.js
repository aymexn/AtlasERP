"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = exports.tenantContext = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const async_hooks_1 = require("async_hooks");
exports.tenantContext = new async_hooks_1.AsyncLocalStorage();
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super();
        this.$use(this.tenancyMiddleware());
    }
    async onModuleInit() {
        await this.$connect();
    }
    tenancyMiddleware() {
        return async (params, next) => {
            const context = exports.tenantContext.getStore();
            const tenantId = context?.tenantId;
            const TENANT_MODELS = [
                'Product', 'ProductFamily', 'Warehouse', 'ProductStock', 'BillOfMaterials',
                'StockMovement', 'Customer', 'SalesOrder', 'Invoice', 'Payment', 'Expense',
                'AuditLog', 'ManufacturingOrder', 'Supplier', 'PurchaseOrder', 'StockReception',
                'CollectionActivity', 'Employee', 'HrDocument', 'PayrollPeriod',
                'PayrollRun', 'Project', 'CalendarEvent', 'CollaborationDocument', 'ApprovalRequest',
                'ActivityFeed', 'Notification', 'User'
            ];
            if (tenantId && params.model && TENANT_MODELS.includes(params.model)) {
                if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
                    params.args.where = { ...params.args.where, companyId: tenantId };
                }
                if (params.action === 'create') {
                    params.args.data = { ...params.args.data, companyId: tenantId };
                }
                if (params.action === 'createMany') {
                    if (Array.isArray(params.args.data)) {
                        params.args.data = params.args.data.map((d) => ({ ...d, companyId: tenantId }));
                    }
                    else {
                        params.args.data.data = params.args.data.data.map((d) => ({ ...d, companyId: tenantId }));
                    }
                }
                if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
                    params.args.where = { ...params.args.where, companyId: tenantId };
                }
            }
            return next(params);
        };
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map