import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { CheckPermission } from '../../rbac/decorators/rbac.decorator';
import { EmployeesService, EmployeeFilters } from './employees.service';

@Controller('hr/employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @CheckPermission('hr', 'employees', 'read')
  async findAll(@Request() req, @Query() filters: EmployeeFilters) {
    return this.employeesService.findAll(req.user.companyId, filters);
  }

  @Get(':id')
  @CheckPermission('hr', 'employees', 'read')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.employeesService.findOne(req.user.companyId, id);
  }

  @Post()
  @CheckPermission('hr', 'employees', 'create')
  async create(@Request() req, @Body() data: any) {
    return this.employeesService.create(req.user.companyId, data);
  }

  @Patch(':id')
  @CheckPermission('hr', 'employees', 'update')
  async update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.employeesService.update(req.user.companyId, id, data);
  }

  @Post(':id/contracts')
  @CheckPermission('hr', 'employees', 'update')
  async addContract(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.employeesService.addContract(req.user.companyId, id, data);
  }

  @Post(':id/documents')
  @CheckPermission('hr', 'employees', 'update')
  async addDocument(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.employeesService.addDocument(req.user.companyId, id, data, req.user.id);
  }

  @Delete('documents/:documentId')
  @CheckPermission('hr', 'employees', 'update')
  async removeDocument(@Request() req, @Param('documentId') documentId: string) {
    return this.employeesService.removeDocument(req.user.companyId, documentId);
  }
}
