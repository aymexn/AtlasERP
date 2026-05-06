import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { CheckPermission } from '../../rbac/decorators/rbac.decorator';
import { LeavesService } from './leaves.service';

@Controller('hr/leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get('types')
  @CheckPermission('hr', 'leaves', 'read')
  async getLeaveTypes(@Request() req) {
    return this.leavesService.getLeaveTypes(req.user.companyId);
  }

  @Post('types')
  @CheckPermission('hr', 'leaves', 'manage')
  async createLeaveType(@Request() req, @Body() data: any) {
    return this.leavesService.createLeaveType(req.user.companyId, data);
  }

  @Get('balance/:employeeId')
  @CheckPermission('hr', 'leaves', 'read')
  async getBalances(@Param('employeeId') employeeId: string, @Query('year') year?: string) {
    return this.leavesService.getBalances(employeeId, year ? parseInt(year) : undefined);
  }

  @Post('requests')
  @CheckPermission('hr', 'leaves', 'create')
  async requestLeave(@Request() req, @Body() data: any) {
    // If user is not HR/Manager, they can only request for themselves.
    // Assuming req.user.employeeId is available if they are linked.
    const employeeId = data.employeeId || req.user.employeeId;
    return this.leavesService.requestLeave(req.user.companyId, employeeId, data);
  }

  @Get('requests')
  @CheckPermission('hr', 'leaves', 'read')
  async findAll(@Request() req, @Query() filters: any) {
    return this.leavesService.findAll(req.user.companyId, filters);
  }

  @Patch('requests/:id/approve-manager')
  @CheckPermission('hr', 'leaves', 'approve')
  async approveByManager(@Request() req, @Param('id') id: string, @Body('comment') comment?: string) {
    return this.leavesService.approveByManager(req.user.companyId, id, req.user.employeeId, comment);
  }

  @Patch('requests/:id/approve-hr')
  @CheckPermission('hr', 'leaves', 'manage')
  async approveByHr(@Request() req, @Param('id') id: string, @Body('comment') comment?: string) {
    return this.leavesService.approveByHr(req.user.companyId, id, req.user.employeeId, comment);
  }

  @Patch('requests/:id/reject')
  @CheckPermission('hr', 'leaves', 'approve')
  async reject(@Request() req, @Param('id') id: string, @Body('comment') comment?: string) {
    return this.leavesService.reject(req.user.companyId, id, req.user.id, comment);
  }

  @Get('calendar')
  @CheckPermission('hr', 'leaves', 'read')
  async getCalendar(@Request() req, @Query('start') start: string, @Query('end') end: string) {
    return this.leavesService.getCalendar(req.user.companyId, new Date(start), new Date(end));
  }
}
