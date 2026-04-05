import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new product' })
    create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
        return this.productsService.create(req.user.companyId, createProductDto);
    }

    @Get()
    @ApiOperation({ summary: 'List all products for the current tenant' })
    findAll(@Request() req: any) {
        return this.productsService.list(req.user.companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a product by ID' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.productsService.findOne(id, req.user.companyId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a product' })
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req: any) {
        return this.productsService.update(id, updateProductDto, req.user.companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a product' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.productsService.remove(id, req.user.companyId);
    }
}
