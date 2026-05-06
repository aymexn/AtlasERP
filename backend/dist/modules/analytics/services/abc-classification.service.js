"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AbcClassificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbcClassificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let AbcClassificationService = AbcClassificationService_1 = class AbcClassificationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AbcClassificationService_1.name);
    }
    async calculateABC(companyId, startDate, endDate) {
        this.logger.log(`Calculating ABC classification for company ${companyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        const revenueData = await this.prisma.$queryRaw `
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
        const totalRevenue = revenueData.reduce((sum, p) => sum + Number(p.annual_revenue), 0);
        let cumulativeRevenue = 0;
        const classifiedProducts = revenueData.map(product => {
            const revenue = Number(product.annual_revenue);
            const revenuePercentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            cumulativeRevenue += revenue;
            const cumulativePercentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
            let classification;
            if (cumulativePercentage <= 80) {
                classification = 'A';
            }
            else if (cumulativePercentage <= 95) {
                classification = 'B';
            }
            else {
                classification = 'C';
            }
            return {
                ...product,
                revenue_percentage: revenuePercentage,
                cumulative_revenue_percentage: cumulativePercentage,
                classification
            };
        });
        await this.prisma.$transaction(classifiedProducts.map(product => this.prisma.abcClassification.create({
            data: {
                productId: product.product_id,
                companyId: companyId,
                classification: product.classification,
                annualRevenue: new library_1.Decimal(product.annual_revenue),
                annualUnitsSold: Number(product.annual_units_sold),
                revenuePercentage: new library_1.Decimal(product.revenue_percentage),
                cumulativeRevenuePercentage: new library_1.Decimal(product.cumulative_revenue_percentage),
                averageStockValue: new library_1.Decimal(product.average_stock_value),
                stockTurnoverRate: new library_1.Decimal(0),
                daysInStock: new library_1.Decimal(0),
                periodStart: startDate,
                periodEnd: endDate
            }
        })));
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
    async getSummary(companyId) {
        const latestClassification = await this.prisma.abcClassification.findFirst({
            where: { companyId },
            orderBy: { classifiedAt: 'desc' },
            select: { classifiedAt: true }
        });
        if (!latestClassification)
            return [];
        return this.prisma.$queryRaw `
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
    async getProductsByClassification(companyId, classification, limit = 50) {
        const latestClassification = await this.prisma.abcClassification.findFirst({
            where: { companyId },
            orderBy: { classifiedAt: 'desc' },
            select: { classifiedAt: true }
        });
        if (!latestClassification)
            return [];
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
};
exports.AbcClassificationService = AbcClassificationService;
exports.AbcClassificationService = AbcClassificationService = AbcClassificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AbcClassificationService);
//# sourceMappingURL=abc-classification.service.js.map