import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalesOrdersService } from './sales-orders.service';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  async findAll(@Request() req) {
    return this.salesOrdersService.findAll(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.salesOrdersService.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() data: any) {
    return this.salesOrdersService.create(req.user.companyId, data);
  }

  @Post(':id/ship')
  async ship(@Request() req, @Param('id') id: string) {
    return this.salesOrdersService.ship(req.user.companyId, req.user.userId, id);
  }

  @Get(':id/profitability')
  async getProfitability(@Request() req, @Param('id') id: string) {
    return this.salesOrdersService.getProfitability(req.user.companyId, id);
  }
}
