import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AbcClassificationService {
  private readonly logger = new Logger(AbcClassificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate ABC classification for all products
   * A items: Top 20% of products contributing to 80% of revenue
   * B items: Next 30% of products contributing to 15% of revenue
   * C items: Bottom 50% of products contributing to 5% of revenue
   */
  async calculateABC(companyId: string, startDate: Date, endDate: Date) {
    this.logger.log(`Calculating ABC classification for company ${companyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 1. Calculate revenue per product for the period
    // We use raw SQL because Prisma aggregations on relations can be complex for this specific case
    const revenueData: any[] = await this.prisma.$queryRaw`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(sol.line_total_ht), 0) as annual_revenue,
        COALESCE(SUM(sol.quantity), 0) as annual_units_sold,
        COALESCE(AVG(ps.quantity * p.standard_cost), 0) as average_stock_value
      FROM products p
      LEFT JOIN sales_order_lines sol ON p.id = sol.product_id
      LEFT JOIN sales_orders so ON sol.sales_order_id = so.id
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      WHERE p.company_id = ${companyId}::uuid
        AND (so.date BETWEEN ${startDate} AND ${endDate} OR so.id IS NULL)
        AND (so.status NOT IN ('CANCELLED', 'DRAFT') OR so.id IS NULL)
      GROUP BY p.id, p.name
      ORDER BY annual_revenue DESC
    `;

    if (revenueData.length === 0) {
      return { success: false, message: 'No sales data found for the specified period' };
    }

    // 2. Calculate total revenue and cumulative percentages
    const totalRevenue = revenueData.reduce((sum, p) => sum + Number(p.annual_revenue), 0);
    
    let cumulativeRevenue = 0;
    const classifiedProducts = revenueData.map(product => {
      const revenue = Number(product.annual_revenue);
      const revenuePercentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      cumulativeRevenue += revenue;
      const cumulativePercentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
      
      // Determine classification
      let classification: string;
      if (cumulativePercentage <= 80) {
        classification = 'A';
      } else if (cumulativePercentage <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }
      
      return {
        ...product,
        revenue_percentage: revenuePercentage,
        cumulative_revenue_percentage: cumulativePercentage,
        classification
      };
    });

    // 3. Save classifications to database
    await this.prisma.$transaction(
      classifiedProducts.map(product => 
        this.prisma.abcClassification.create({
          data: {
            productId: product.product_id,
            companyId: companyId,
            classification: product.classification,
            annualRevenue: new Decimal(product.annual_revenue),
            annualUnitsSold: Number(product.annual_units_sold),
            revenuePercentage: new Decimal(product.revenue_percentage),
            cumulativeRevenuePercentage: new Decimal(product.cumulative_revenue_percentage),
            averageStockValue: new Decimal(product.average_stock_value),
            stockTurnoverRate: new Decimal(0), // Placeholder, should be calculated
            daysInStock: new Decimal(0), // Placeholder
            periodStart: startDate,
            periodEnd: endDate
          }
        })
      )
    );

    return { 
      success: true, 
      summary: {
        totalProducts: classifiedProducts.length,
        aItems: classifiedProducts.filter(p => p.classification === 'A').length,
        bItems: classifiedProducts.filter(p => p.classification === 'B').length,
        cItems: classifiedProducts.filter(p => p.classification === 'C').length,
        totalRevenue
      }
    };
  }

  async getSummary(companyId: string) {
    const latestClassification = await this.prisma.abcClassification.findFirst({
      where: { companyId },
      orderBy: { classifiedAt: 'desc' },
      select: { classifiedAt: true }
    });

    if (!latestClassification) return [];

    return this.prisma.$queryRaw`
      SELECT 
        classification,
        COUNT(*)::int as product_count,
        SUM(annual_revenue) as total_revenue,
        AVG(stock_turnover_rate) as avg_turnover_rate,
        AVG(revenue_percentage) as avg_revenue_percentage
      FROM abc_classifications
      WHERE company_id = ${companyId}::uuid
        AND classified_at = ${latestClassification.classifiedAt}
      GROUP BY classification
      ORDER BY classification
    `;
  }

  async getProductsByClassification(companyId: string, classification: string, limit = 50) {
    const latestClassification = await this.prisma.abcClassification.findFirst({
      where: { companyId },
      orderBy: { classifiedAt: 'desc' },
      select: { classifiedAt: true }
    });

    if (!latestClassification) return [];

    return this.prisma.abcClassification.findMany({
      where: {
        companyId,
        classification,
        classifiedAt: latestClassification.classifiedAt
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            family: { select: { name: true } }
          }
        }
      },
      orderBy: { revenuePercentage: 'desc' },
      take: limit
    });
  }
}
