import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, Res } from '@nestjs/common';
import { ManufacturingOrdersService } from './manufacturing-orders.service';
import { CreateManufacturingOrderDto, UpdateManufacturingOrderDto, CompleteManufacturingOrderDto } from './dto/manufacturing-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PdfService } from '../../common/services/pdf.service';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('manufacturing-orders')
export class ManufacturingOrdersController {
  constructor(
    private readonly manufacturingOrdersService: ManufacturingOrdersService,
    private readonly pdfService: PdfService
  ) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateManufacturingOrderDto) {
    return this.manufacturingOrdersService.create(req.user.companyId, createDto);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.manufacturingOrdersService.findAll(req.user.companyId, status);
  }

  @Get(':id/pdf')
  async getPdf(@Request() req, @Param('id') id: string, @Res() res) {
    const companyId = req.user.companyId;
    const order = await this.manufacturingOrdersService.findForPdf(companyId, id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=WorkOrder_${order.reference}.pdf`);
    return this.pdfService.generateWorkOrderPdf(order, res);
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

  @Post(':id/close')
  close(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.manufacturingOrdersService.closeManufacturingOrder(req.user.companyId, req.user.id, id, body?.producedQuantity);
  }

  @Post(':id/cancel')
  cancel(@Request() req, @Param('id') id: string) {
    return this.manufacturingOrdersService.cancel(req.user.companyId, id);
  }
}
