import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomersService, CustomerFilters } from './customers.service';

import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Request() req, @Query() filters: CustomerFilters) {
    return this.customersService.findAll(req.user.companyId, filters);
  }

  @Get(':id/performance')
  async getPerformanceData(@Request() req, @Param('id') id: string) {
    return this.customersService.getPerformanceData(req.user.companyId, id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.customersService.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(req.user.companyId, createCustomerDto);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.customersService.update(req.user.companyId, id, data);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.customersService.remove(req.user.companyId, id);
  }
}
