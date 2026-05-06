import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PdfService } from '../../common/services/pdf.service';
import { TenantsService } from '../tenants/tenants.service';
import { Response } from 'express';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly pdfService: PdfService,
        private readonly tenantsService: TenantsService
    ) { }

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

    @Get('export/pdf')
    @ApiOperation({ summary: 'Export inventory as PDF' })
    async exportPdf(@Request() req: any, @Res() res: Response) {
        try {
            const products = await this.productsService.list(req.user.companyId);
            // Fetch company with details for the PDF header
            const company = await this.tenantsService.findByUserId(req.user.userId);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Inventory-Report.pdf');

            await this.pdfService.generateInventoryPdf(company, products, res);
        } catch (error) {
            console.error('Inventory PDF Export Error:', error);
            res.status(500).json({ message: 'Error generating inventory PDF' });
        }
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

    @Post(':id/recalculate-cost')
    @ApiOperation({ summary: 'Recalculate product standard cost based on active formula' })
    recalculateCost(@Param('id') id: string, @Request() req: any) {
        return this.productsService.recalculateCost(id, req.user.companyId);
    }
}
