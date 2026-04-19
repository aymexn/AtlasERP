import { Controller, Get, Post, Body, Param, Req, Res, UseGuards, Put, Delete } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PdfService } from '../../common/services/pdf.service';
import { TenantsService } from '../tenants/tenants.service';
import { Response } from 'express';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly pdfService: PdfService,
    private readonly tenantsService: TenantsService
  ) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.expensesService.findAll(req.user.companyId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
      return this.expensesService.getStats(req.user.companyId);
  }

  @Get('export/pdf')
  async exportPdf(@Req() req: any, @Res() res: Response) {
    try {
      const expenses = await this.expensesService.findAll(req.user.companyId);
      const company = await this.tenantsService.findByUserId(req.user.userId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=Expenses-Recap.pdf');

      await this.pdfService.generateExpensesPdf(company, expenses, res);
    } catch (error) {
      console.error('Expenses PDF Export Error:', error);
      res.status(500).json({ message: 'Error generating expenses PDF' });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.expensesService.create(req.user.companyId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
      return this.expensesService.update(req.user.companyId, id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
      return this.expensesService.remove(req.user.companyId, id);
  }

}
