import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Product Families')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-families')
export class FamiliesController {
    constructor(private readonly familiesService: FamiliesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new product family' })
    create(@Body() createFamilyDto: CreateFamilyDto, @Request() req: any) {
        return this.familiesService.create(req.user.companyId, createFamilyDto);
    }

    @Get()
    @ApiOperation({ summary: 'List all product families' })
    findAll(@Request() req: any) {
        return this.familiesService.findAll(req.user.companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a product family' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.familiesService.remove(id, req.user.companyId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a product family' })
    update(@Param('id') id: string, @Body() dto: UpdateFamilyDto, @Request() req: any) {
        return this.familiesService.update(id, req.user.companyId, dto);
    }
}
