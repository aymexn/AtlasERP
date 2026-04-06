import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Request() req) {
    return this.customersService.findAll(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.customersService.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() data: any) {
    return this.customersService.create(req.user.companyId, data);
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
