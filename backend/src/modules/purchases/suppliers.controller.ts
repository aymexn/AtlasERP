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
    console.log('[SuppliersController.create] Payload:', createDto);
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
    console.log(`[SuppliersController.update] ID: ${id}, Payload:`, updateDto);
    return this.suppliersService.update(id, req.user.companyId, updateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.suppliersService.remove(id, req.user.companyId);
  }

  // --- CATALOG ENDPOINTS ---

  @Get(':id/products')
  getCatalog(@Param('id') id: string) {
    return this.suppliersService.getCatalog(id);
  }

  @Post(':id/products')
  addProductToCatalog(@Param('id') id: string, @Body() data: any) {
    return this.suppliersService.addProductToCatalog(id, data);
  }

  @Delete('products/:id')
  removeProductFromCatalog(@Param('id') id: string) {
    return this.suppliersService.removeProductFromCatalog(id);
  }
}
