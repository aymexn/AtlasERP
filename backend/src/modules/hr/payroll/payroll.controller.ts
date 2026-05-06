import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { CheckPermission } from '../../rbac/decorators/rbac.decorator';
import { PayrollService } from './payroll.service';

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

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
