"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const users_module_1 = require("./modules/users/users.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const products_module_1 = require("./modules/products/products.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const manufacturing_orders_module_1 = require("./modules/manufacturing-orders/manufacturing-orders.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const health_module_1 = require("./modules/health/health.module");
const purchases_module_1 = require("./modules/purchases/purchases.module");
const customers_module_1 = require("./modules/customers/customers.module");
const sales_module_1 = require("./modules/sales/sales.module");
const invoices_module_1 = require("./modules/invoices/invoices.module");
const payments_module_1 = require("./modules/payments/payments.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const common_module_1 = require("./common/common.module");
const audit_module_1 = require("./modules/audit/audit.module");
const core_1 = require("@nestjs/core");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const treasury_module_1 = require("./modules/treasury/treasury.module");
const rbac_module_1 = require("./modules/rbac/rbac.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const employees_module_1 = require("./modules/hr/employees/employees.module");
const leaves_module_1 = require("./modules/hr/leaves/leaves.module");
const payroll_module_1 = require("./modules/hr/payroll/payroll.module");
const recruitment_module_1 = require("./modules/hr/recruitment/recruitment.module");
const performance_module_1 = require("./modules/hr/performance/performance.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            products_module_1.ProductsModule,
            inventory_module_1.InventoryModule,
            manufacturing_orders_module_1.ManufacturingOrdersModule,
            dashboard_module_1.DashboardModule,
            health_module_1.HealthModule,
            purchases_module_1.PurchasesModule,
            customers_module_1.CustomersModule,
            sales_module_1.SalesModule,
            invoices_module_1.InvoicesModule,
            payments_module_1.PaymentsModule,
            expenses_module_1.ExpensesModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            treasury_module_1.TreasuryModule,
            rbac_module_1.RbacModule,
            analytics_module_1.AnalyticsModule,
            employees_module_1.EmployeesModule,
            leaves_module_1.LeavesModule,
            payroll_module_1.PayrollModule,
            recruitment_module_1.RecruitmentModule,
            performance_module_1.PerformanceModule
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_interceptor_1.AuditInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map