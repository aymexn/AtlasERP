import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateSupplierDto) {
    return this.suppliersService.create(req.user.companyId, createDto);
  }

  @Get()
  list(@Request() req) {
    return this.suppliersService.list(req.user.companyId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.suppliersService.getStats(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.suppliersService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, req.user.companyId, updateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.suppliersService.remove(id, req.user.companyId);
  }
}
