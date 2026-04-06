import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { StockReceptionsService } from './stock-receptions.service';
import { StockReceptionsController } from './stock-receptions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
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
