import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ManufacturingOrdersService } from './manufacturing-orders.service';
import { CreateManufacturingOrderDto, UpdateManufacturingOrderDto, CompleteManufacturingOrderDto } from './dto/manufacturing-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('manufacturing-orders')
export class ManufacturingOrdersController {
  constructor(private readonly manufacturingOrdersService: ManufacturingOrdersService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateManufacturingOrderDto) {
    return this.manufacturingOrdersService.create(req.user.companyId, createDto);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.manufacturingOrdersService.findAll(req.user.companyId, status);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.manufacturingOrdersService.findOne(req.user.companyId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateManufacturingOrderDto) {
    return this.manufacturingOrdersService.update(req.user.companyId, id, updateDto);
  }

  @Post(':id/plan')
  plan(@Request() req, @Param('id') id: string) {
    return this.manufacturingOrdersService.plan(req.user.companyId, id);
  }

  @Post(':id/start')
  start(@Request() req, @Param('id') id: string) {
    return this.manufacturingOrdersService.start(req.user.companyId, req.user.id, id);
  }

  @Post(':id/complete')
  complete(@Request() req, @Param('id') id: string, @Body() completeDto: CompleteManufacturingOrderDto) {
    return this.manufacturingOrdersService.complete(req.user.companyId, req.user.id, id, completeDto);
  }

  @Post(':id/cancel')
  cancel(@Request() req, @Param('id') id: string) {
    return this.manufacturingOrdersService.cancel(req.user.companyId, id);
  }
}
