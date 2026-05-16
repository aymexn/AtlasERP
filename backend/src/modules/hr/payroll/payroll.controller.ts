import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { CheckPermission } from '../../rbac/decorators/rbac.decorator';
import { PayrollService } from './payroll.service';
import { PdfService } from '../../../common/services/pdf.service';
import { Response } from 'express';

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly pdfService: PdfService
  ) {}

  @Get('periods')
  @CheckPermission('hr', 'payroll', 'read')
  async getPeriods(@Request() req) {
    return this.payrollService.getPeriods(req.user.companyId);
  }

  @Post('periods')
  @CheckPermission('hr', 'payroll', 'create')
  async createPeriod(@Request() req, @Body() data: any) {
    return this.payrollService.createPeriod(req.user.companyId, data);
  }

  @Post('periods/:id/calculate')
  @CheckPermission('hr', 'payroll', 'approve')
  async calculatePayroll(@Request() req, @Param('id') id: string) {
    return this.payrollService.calculatePayroll(req.user.companyId, id);
  }

  @Get('periods/:id/runs')
  @CheckPermission('hr', 'payroll', 'read')
  async getPayrollRuns(@Param('id') id: string) {
    return this.payrollService.getPayrollRuns(id);
  }

  @Get('runs/:id/pdf')
  @CheckPermission('hr', 'payroll', 'read')
  async streamPayslip(@Param('id') id: string, @Res() res: Response) {
    const run = await this.payrollService.getPayrollRunForPdf(id);
    if (!run) throw new NotFoundException('Payroll run not found');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bulletin_${run.employee?.lastName}_${id.substring(0, 5)}.pdf`);
    
    await this.pdfService.generatePayslipPdf(run, res);
  }

  @Post('runs/:id/payslip')
  @CheckPermission('hr', 'payroll', 'approve')
  async generatePayslip(@Param('id') id: string) {
    return this.payrollService.generatePayslip(id);
  }

  @Get('employees/:id/payslips')
  @CheckPermission('hr', 'payroll', 'read')
  async getEmployeePayslips(@Param('id') id: string) {
    return this.payrollService.getPayslips(id);
  }
}
