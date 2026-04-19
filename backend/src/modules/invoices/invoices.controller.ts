import { Controller, Get, Post, Body, Param, Req, Res, UseGuards, Patch } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PdfService } from '../../common/services/pdf.service';
import { Response } from 'express';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
      private readonly invoicesService: InvoicesService,
      private readonly pdfService: PdfService
  ) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.invoicesService.findAll(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.invoicesService.findOne(req.user.companyId, id);
  }

  @Post('from-sales-order')
  async createFromSalesOrder(
    @Body() body: { salesOrderId: string; paymentMethod: any },
    @Req() req: any
  ) {
    return this.invoicesService.createFromSalesOrder(
      req.user.companyId,
      body.salesOrderId,
      body.paymentMethod
    );
  }

  @Post(':id/payments')
  async addPayment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.invoicesService.addPayment(req.user.companyId, id, body);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: any) {
      return this.invoicesService.cancel(req.user.companyId, id);
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    try {
      const invoice = await this.invoicesService.findOne(req.user.companyId, id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.reference}.pdf`);
      
      await this.pdfService.generateInvoicePdf(invoice, res);
    } catch (error) {
      console.error('Invoice PDF Route Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error generating invoice PDF', 
          error: error.message 
        });
      }
    }
  }
}
