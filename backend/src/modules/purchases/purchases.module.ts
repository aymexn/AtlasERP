import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { StockReceptionsService } from './stock-receptions.service';
import { StockReceptionsController } from './stock-receptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StockMovementService } from '../inventory/services/stock-movement.service';

@Module({
  imports: [PrismaModule, InventoryModule],
  providers: [
    SuppliersService,
    PurchaseOrdersService,
    StockReceptionsService,
  ],
  controllers: [
    SuppliersController,
    PurchaseOrdersController,
    StockReceptionsController,
  ],
  exports: [
    SuppliersService,
    PurchaseOrdersService,
    StockReceptionsService,
  ],
})
export class PurchasesModule {}
