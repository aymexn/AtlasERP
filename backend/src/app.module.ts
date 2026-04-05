import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ManufacturingOrdersModule } from './modules/manufacturing-orders/manufacturing-orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
    imports: [AuthModule, TenantsModule, UsersModule, PrismaModule, ProductsModule, InventoryModule, ManufacturingOrdersModule, DashboardModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
