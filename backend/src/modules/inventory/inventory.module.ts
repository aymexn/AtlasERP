import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { StockMovementService } from './services/stock-movement.service';
import { InventoryService } from './services/inventory.service';
import { WarehousesService } from './services/warehouses.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WarehousesController } from './warehouses.controller';

import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [InventoryController, WarehousesController],
  providers: [StockMovementService, InventoryService, WarehousesService],
  exports: [StockMovementService, InventoryService, WarehousesService],
})
export class InventoryModule {}
