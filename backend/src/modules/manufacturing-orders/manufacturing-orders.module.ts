import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ManufacturingOrdersController } from './manufacturing-orders.controller';
import { ManufacturingOrdersService } from './manufacturing-orders.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [ManufacturingOrdersController],
  providers: [ManufacturingOrdersService],
  exports: [ManufacturingOrdersService],
})
export class ManufacturingOrdersModule {}
