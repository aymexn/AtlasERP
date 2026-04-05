import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StockMovementService } from './services/stock-movement.service';
import { InventoryService } from './services/inventory.service';
import { CreateStockMovementDto } from './dto/create-movement.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly stockMovementService: StockMovementService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Post('movements')
  @ApiOperation({ summary: 'Create a new stock movement' })
  async createMovement(@Request() req, @Body() dto: CreateStockMovementDto) {
    return this.stockMovementService.createMovement(req.user.companyId, req.user.userId, dto);
  }

  @Get('movements')
  @ApiOperation({ summary: 'List all stock movements' })
  async listMovements(@Request() req) {
    return this.stockMovementService.listMovements(req.user.companyId);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Get current stock per product' })
  async getStock(@Request() req, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getProductsStock(req.user.companyId, warehouseId);
  }

  @Get('products-stock')
  @ApiOperation({ summary: 'Get stock dashboard summary' })
  async getProductsStockDashboard(@Request() req) {
    return this.inventoryService.getInventorySummary(req.user.companyId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  async getAlerts(@Request() req) {
    return this.inventoryService.getLowStockAlerts(req.user.companyId);
  }

  @Get('product/:id/history')
  @ApiOperation({ summary: 'Get movement history for a specific product' })
  async getProductHistory(@Param('id') productId: string, @Request() req) {
    return this.stockMovementService.getProductMovementHistory(productId, req.user.companyId);
  }
}
