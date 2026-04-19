import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, Res } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PurchaseOrderStatus } from '@prisma/client';
import { PdfService } from '../../common/services/pdf.service';
import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly pdfService: PdfService
  ) {}

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

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
    try {
      const order = await this.purchaseOrdersService.findOne(id, req.user.companyId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=PurchaseOrder-${order.reference}.pdf`);
      
      await this.pdfService.generatePurchaseOrderPdf(order, res);
    } catch (error) {
      console.error('Purchase Order PDF Route Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error generating purchase order PDF', 
          error: error.message 
        });
      }
    }
  }
}
