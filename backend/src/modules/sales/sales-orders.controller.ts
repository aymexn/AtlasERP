import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalesOrdersService } from './sales-orders.service';
import { PdfService } from '../../common/services/pdf.service';
import { Public } from '../../common/decorators/public.decorator';
import { Response } from 'express';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrdersController {
  constructor(
    private readonly salesOrdersService: SalesOrdersService,
    private readonly pdfService: PdfService
  ) {}

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

  @Patch(':id/validate')
  async validate(@Request() req, @Param('id') id: string) {
    return this.salesOrdersService.validateOrder(req.user.companyId, id);
  }

  @Patch(':id/cancel')
  async cancel(@Request() req, @Param('id') id: string) {
    return this.salesOrdersService.cancelOrder(req.user.companyId, id);
  }

  @Get(':id/profitability')
  async getProfitability(@Request() req, @Param('id') id: string) {
    return this.salesOrdersService.getProfitability(req.user.companyId, id);
  }

  @Public()
  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
    try {
      // If authenticated, use companyId for extra security. If not (Public Rescue), use findOneById version.
      const companyId = req.user?.companyId;
      const order = companyId 
        ? await this.salesOrdersService.findOne(companyId, id)
        : await this.salesOrdersService.findOnePublic(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Order-${order.reference}.pdf`);
      
      await this.pdfService.generateSalesOrderPdf(order, res);
    } catch (error) {
      console.error('Sales Order PDF Route Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error generating sales order PDF', 
          error: error.message 
        });
      }
    }
  }
}
