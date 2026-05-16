import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VariantsService } from './variants.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Product Variants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products/:productId/variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Get()
  findAll(@Param('productId') productId: string) {
    return this.variantsService.findAll(productId);
  }

  @Post()
  create(@Param('productId') productId: string, @Body() data: any) {
    return this.variantsService.create(productId, data);
  }

  @Post('matrix')
  generateMatrix(@Param('productId') productId: string, @Body() attributes: Record<string, string[]>) {
    return this.variantsService.generateMatrix(productId, attributes);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.variantsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variantsService.remove(id);
  }
}
