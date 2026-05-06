import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { CheckPermission } from '../../rbac/decorators/rbac.decorator';
import { PerformanceService } from './performance.service';

@Controller('hr/performance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('cycles')
  @CheckPermission('hr', 'performance', 'read')
  async getCycles(@Request() req) {
    return this.performanceService.getCycles(req.user.companyId);
  }

  @Post('cycles')
  @CheckPermission('hr', 'performance', 'manage')
  async createCycle(@Request() req, @Body() data: any) {
    return this.performanceService.createCycle(req.user.companyId, data);
  }

  @Post('cycles/:id/initialize')
  @CheckPermission('hr', 'performance', 'manage')
  async initializeReviews(@Param('id') id: string) {
    return this.performanceService.initializeReviews(id);
  }

  @Get('cycles/:id/reviews')
  @CheckPermission('hr', 'performance', 'read')
  async getReviews(@Param('id') id: string) {
    return this.performanceService.getReviews(id);
  }

  @Put('reviews/:id/self')
  @CheckPermission('hr', 'performance', 'update')
  async updateSelfReview(@Param('id') id: string, @Body() data: any) {
    return this.performanceService.updateSelfReview(id, data);
  }

  @Put('reviews/:id/manager')
  @CheckPermission('hr', 'performance', 'update')
  async updateManagerReview(@Param('id') id: string, @Body() data: any) {
    return this.performanceService.updateManagerReview(id, data);
  }

  @Post('reviews/:id/objectives')
  @CheckPermission('hr', 'performance', 'update')
  async createObjective(@Param('id') id: string, @Body() data: any) {
    return this.performanceService.createObjective(id, data);
  }

  @Get('employees/:id/history')
  @CheckPermission('hr', 'performance', 'read')
  async getEmployeeHistory(@Param('id') id: string) {
    return this.performanceService.getEmployeeHistory(id);
  }
}
