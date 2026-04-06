import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PurchaseOrderStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(req.user.companyId, createDto);
  }

  @Get()
  list(@Request() req, @Query('status') status?: PurchaseOrderStatus) {
    return this.purchaseOrdersService.list(req.user.companyId, status);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id, req.user.companyId);
  }

  @Post(':id/confirm')
  confirm(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.confirm(id, req.user.companyId);
  }

  @Post(':id/send')
  send(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.send(id, req.user.companyId);
  }

  @Post(':id/cancel')
  cancel(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.cancel(id, req.user.companyId);
  }

  @Post(':id/create-reception')
  createReception(
    @Request() req, 
    @Param('id') id: string, 
    @Body('warehouseId') warehouseId: string,
    @Body('notes') notes?: string
  ) {
    return this.purchaseOrdersService.createReception(id, req.user.companyId, warehouseId, notes);
  }
}
