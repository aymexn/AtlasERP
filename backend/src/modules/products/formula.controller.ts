import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormulaService } from './formula.service';
import { CreateFormulaDto, UpdateFormulaDto, CreateFormulaLineDto, UpdateFormulaLineDto } from './dto/formula.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Formulas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formulas')
export class FormulaController {
    constructor(private readonly formulaService: FormulaService) { }

    @Get('product/:productId')
    @ApiOperation({ summary: 'Get all formulas for a product' })
    getProductFormulas(@Param('productId') productId: string, @Request() req: any) {
        return this.formulaService.getProductFormulas(productId, req.user.companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get formula by ID' })
    getFormula(@Param('id') id: string, @Request() req: any) {
        return this.formulaService.getFormula(id, req.user.companyId);
    }

    @Post('product/:productId')
    @ApiOperation({ summary: 'Create formula for a product' })
    createFormula(@Param('productId') productId: string, @Body() dto: CreateFormulaDto, @Request() req: any) {
        return this.formulaService.createFormula(productId, req.user.companyId, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update formula' })
    updateFormula(@Param('id') id: string, @Body() dto: UpdateFormulaDto, @Request() req: any) {
        return this.formulaService.updateFormula(id, req.user.companyId, dto);
    }

    @Post(':id/activate')
    @ApiOperation({ summary: 'Activate formula' })
    activateFormula(@Param('id') id: string, @Request() req: any) {
        return this.formulaService.updateFormulaStatus(id, req.user.companyId, 'ACTIVE');
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Archive formula' })
    archiveFormula(@Param('id') id: string, @Request() req: any) {
        return this.formulaService.updateFormulaStatus(id, req.user.companyId, 'ARCHIVED');
    }

    @Post(':id/lines')
    @ApiOperation({ summary: 'Add a line to product formula' })
    addLine(@Param('id') id: string, @Body() dto: CreateFormulaLineDto, @Request() req: any) {
        return this.formulaService.addLine(id, req.user.companyId, dto);
    }

    @Patch('lines/:lineId')
    @ApiOperation({ summary: 'Update a formula line' })
    updateLine(@Param('lineId') lineId: string, @Body() dto: UpdateFormulaLineDto, @Request() req: any) {
        return this.formulaService.updateLine(lineId, req.user.companyId, dto);
    }

    @Delete('lines/:lineId')
    @ApiOperation({ summary: 'Remove a formula line' })
    removeLine(@Param('lineId') lineId: string, @Request() req: any) {
        return this.formulaService.removeLine(lineId, req.user.companyId);
    }
}
