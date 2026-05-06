import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AbcClassificationService } from './abc-classification.service';
import { DeadStockService } from './dead-stock.service';
import { ReorderPointService } from './reorder-point.service';

@Injectable()
export class AnalyticsCronService {
  private readonly logger = new Logger(AnalyticsCronService.name);

  constructor(
    private prisma: PrismaService,
    private abcService: AbcClassificationService,
    private deadStockService: DeadStockService,
    private reorderService: ReorderPointService,
  ) {}

  // Run ABC classification weekly (Every Sunday at 2 AM)
  @Cron(CronExpression.EVERY_WEEKEND)
  async handleWeeklyAbc() {
    this.logger.log('Starting automated weekly ABC classification...');
    const companies = await this.prisma.company.findMany({ select: { id: true } });
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    for (const company of companies) {
      try {
        await this.abcService.calculateABC(company.id, startDate, endDate);
      } catch (error) {
        this.logger.error(`Failed ABC for company ${company.id}: ${error.message}`);
      }
    }
    this.logger.log('Automated ABC classification completed');
  }

  // Identify dead stock daily (Every day at 3 AM)
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyDeadStock() {
    this.logger.log('Starting automated daily dead stock identification...');
    const companies = await this.prisma.company.findMany({ select: { id: true } });

    for (const company of companies) {
      try {
        await this.deadStockService.identifyDeadStock(company.id);
      } catch (error) {
        this.logger.error(`Failed Dead Stock for company ${company.id}: ${error.message}`);
      }
    }
    this.logger.log('Automated dead stock identification completed');
  }

  // Update reorder points weekly (Every Monday at 1 AM)
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReorderPoints() {
    this.logger.log('Starting automated weekly reorder points calculation...');
    const products = await this.prisma.product.findMany({
      where: { trackStock: true },
      select: { id: true, companyId: true }
    });

    for (const product of products) {
      try {
        await this.reorderService.calculateReorderPoint(product.companyId, product.id, null);
      } catch (error) {
        this.logger.debug(`Failed Reorder Point for product ${product.id}: ${error.message}`);
      }
    }
    this.logger.log('Automated reorder points calculation completed');
  }
}
