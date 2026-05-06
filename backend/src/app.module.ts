import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ManufacturingOrdersModule } from './modules/manufacturing-orders/manufacturing-orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { CommonModule } from './common/common.module';
import { AuditModule } from './modules/audit/audit.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EmployeesModule } from './modules/hr/employees/employees.module';
import { LeavesModule } from './modules/hr/leaves/leaves.module';
import { PayrollModule } from './modules/hr/payroll/payroll.module';
import { RecruitmentModule } from './modules/hr/recruitment/recruitment.module';
import { PerformanceModule } from './modules/hr/performance/performance.module';


@Module({
    imports: [
        AuthModule, 
        TenantsModule, 
        UsersModule, 
        PrismaModule, 
        CommonModule,
        ProductsModule, 
        InventoryModule, 
        ManufacturingOrdersModule, 
        DashboardModule, 
        HealthModule,
        PurchasesModule,
        CustomersModule,
        SalesModule,
        InvoicesModule,
        PaymentsModule,
        ExpensesModule,
        AuditModule,
        NotificationsModule,
        TreasuryModule,
        RbacModule,
        AnalyticsModule,
        EmployeesModule,
        LeavesModule,
        PayrollModule,
        RecruitmentModule,
        PerformanceModule
    ],
    controllers: [],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },
    ],
})
export class AppModule { }
