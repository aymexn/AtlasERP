import { Controller, Get, Post, Body, Query, UseGuards, Param, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AbcClassificationService } from './services/abc-classification.service';
import { StockTurnoverService } from './services/stock-turnover.service';
import { DeadStockService } from './services/dead-stock.service';
import { ReorderPointService } from './services/reorder-point.service';
import { SupplierPerformanceService } from './services/supplier-performance.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private abcService: AbcClassificationService,
    private turnoverService: StockTurnoverService,
    private deadStockService: DeadStockService,
    private reorderService: ReorderPointService,
    private supplierService: SupplierPerformanceService,
    private dashboardService: DashboardAnalyticsService,
  ) {}

  // Dashboard KPIs
  @Get('kpi')
  async getKpis(@Request() req: any, @Query('period') period?: string) {
    return this.dashboardService.getKPIs(req.user.companyId, period);
  }

  // Predictive Alerts ("Bientôt")
  @Get('alerts/imminent-rupture')
  async getImminentRupture(@Request() req: any) {
    return this.dashboardService.getImminentRupture(req.user.companyId);
  }

  @Get('alerts/surstock')
  async getSurstock(@Request() req: any) {
    return this.dashboardService.getSurstock(req.user.companyId);
  }

  @Get('alerts/payment-delays')
  async getPaymentDelays(@Request() req: any) {
    return this.dashboardService.getPaymentDelays(req.user.companyId);
  }

  @Get('alerts/production-bottlenecks')
  async getProductionBottlenecks(@Request() req: any) {
    return this.dashboardService.getProductionBottlenecks(req.user.companyId);
  }

  // Charts
  @Get('charts/revenue-evolution')
  async getRevenueEvolution(@Request() req: any, @Query('days') days?: number) {
    return this.dashboardService.getRevenueEvolution(req.user.companyId, days ? Number(days) : 30);
  }

  @Get('charts/top-products')
  async getTopProducts(@Request() req: any, @Query('limit') limit?: number) {
    return this.dashboardService.getTopProducts(req.user.companyId, limit ? Number(limit) : 5);
  }

  @Get('charts/category-distribution')
  async getCategoryDistribution(@Request() req: any) {
    return this.dashboardService.getCategoryDistribution(req.user.companyId);
  }

  @Get('recent-transactions')
  async getRecentTransactions(@Request() req: any, @Query('limit') limit?: number) {
    return this.dashboardService.getRecentTransactions(req.user.companyId, limit ? Number(limit) : 10);
  }

  // ABC Classification
  @Post('abc/calculate')
  async calculateAbc(
    @Request() req: any,
    @Body() body: { startDate: string; endDate: string }
  ) {
    return this.abcService.calculateABC(
      req.user.companyId,
      new Date(body.startDate),
      new Date(body.endDate)
    );
  }

  @Get('abc/summary')
  async getAbcSummary(@Request() req: any) {
    return this.abcService.getSummary(req.user.companyId);
  }

  @Get('abc/products/:classification')
  async getAbcProducts(
    @Request() req: any,
    @Param('classification') classification: string,
    @Query('limit') limit?: number
  ) {
    return this.abcService.getProductsByClassification(req.user.companyId, classification, limit);
  }

  // Dead Stock
  @Post('dead-stock/identify')
  async identifyDeadStock(
    @Request() req: any,
    @Body() body: { daysThreshold?: number }
  ) {
    return this.deadStockService.identifyDeadStock(req.user.companyId, body.daysThreshold);
  }

  @Get('dead-stock')
  async getDeadStockReport(
    @Request() req: any,
    @Query('category') category?: string
  ) {
    const items = await this.deadStockService.getReport(req.user.companyId, category);
    // Simplified summary calculation for the response
    const summary = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + Number(item.stockValue), 0),
      byCategory: {
        slowMoving: items.filter(i => i.category === 'slow_moving').length,
        deadStock: items.filter(i => i.category === 'dead_stock').length,
        obsolete: items.filter(i => i.category === 'obsolete').length
      }
    };
    return { items, summary };
  }

  @Post('dead-stock/:id/action')
  async markDeadStockAction(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { action: string }
  ) {
    return this.deadStockService.markAction(id, body.action, req.user.id);
  }

  // Reorder Points
  @Get('reorder-points/alerts')
  async getReorderAlerts(@Request() req: any) {
    return this.reorderService.getAlerts(req.user.companyId);
  }

  @Post('reorder-points/calculate/:productId')
  async calculateReorderPoint(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() body: { warehouseId?: string; serviceLevel?: number }
  ) {
    return this.reorderService.calculateReorderPoint(
      req.user.companyId,
      productId,
      body.warehouseId || null,
      body.serviceLevel
    );
  }

  // Supplier Performance
  @Get('supplier-performance/rankings')
  async getSupplierRankings(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.supplierService.getRankings(
      req.user.companyId,
      new Date(startDate),
      new Date(endDate)
    );
  }
}
