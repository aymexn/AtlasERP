import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UomService } from './uom.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Units of Measure')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uoms')
export class UomController {
  constructor(private readonly uomService: UomService) {}

  @Get()
  findAll(@Request() req) {
    return this.uomService.findAll(req.user.companyId);
  }

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.uomService.create(req.user.companyId, data);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.uomService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.uomService.update(id, req.user.companyId, data);
  }

  @Get('product/:productId')
  getProductUoms(@Param('productId') productId: string) {
    return this.uomService.getProductUoms(productId);
  }

  @Post('product/:productId')
  addProductUom(@Param('productId') productId: string, @Body() data: any) {
    return this.uomService.addProductUom(productId, data);
  }

  @Delete('product/:id')
  removeProductUom(@Param('id') id: string) {
    return this.uomService.removeProductUom(id);
  }
}
