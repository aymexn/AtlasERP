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
var AnalyticsCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const abc_classification_service_1 = require("./abc-classification.service");
const dead_stock_service_1 = require("./dead-stock.service");
const reorder_point_service_1 = require("./reorder-point.service");
let AnalyticsCronService = AnalyticsCronService_1 = class AnalyticsCronService {
    constructor(prisma, abcService, deadStockService, reorderService) {
        this.prisma = prisma;
        this.abcService = abcService;
        this.deadStockService = deadStockService;
        this.reorderService = reorderService;
        this.logger = new common_1.Logger(AnalyticsCronService_1.name);
    }
    async handleWeeklyAbc() {
        this.logger.log('Starting automated weekly ABC classification...');
        const companies = await this.prisma.company.findMany({ select: { id: true } });
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        for (const company of companies) {
            try {
                await this.abcService.calculateABC(company.id, startDate, endDate);
            }
            catch (error) {
                this.logger.error(`Failed ABC for company ${company.id}: ${error.message}`);
            }
        }
        this.logger.log('Automated ABC classification completed');
    }
    async handleDailyDeadStock() {
        this.logger.log('Starting automated daily dead stock identification...');
        const companies = await this.prisma.company.findMany({ select: { id: true } });
        for (const company of companies) {
            try {
                await this.deadStockService.identifyDeadStock(company.id);
            }
            catch (error) {
                this.logger.error(`Failed Dead Stock for company ${company.id}: ${error.message}`);
            }
        }
        this.logger.log('Automated dead stock identification completed');
    }
    async handleWeeklyReorderPoints() {
        this.logger.log('Starting automated weekly reorder points calculation...');
        const products = await this.prisma.product.findMany({
            where: { trackStock: true },
            select: { id: true, companyId: true }
        });
        for (const product of products) {
            try {
                await this.reorderService.calculateReorderPoint(product.companyId, product.id, null);
            }
            catch (error) {
                this.logger.debug(`Failed Reorder Point for product ${product.id}: ${error.message}`);
            }
        }
        this.logger.log('Automated reorder points calculation completed');
    }
};
exports.AnalyticsCronService = AnalyticsCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEKEND),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsCronService.prototype, "handleWeeklyAbc", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsCronService.prototype, "handleDailyDeadStock", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsCronService.prototype, "handleWeeklyReorderPoints", null);
exports.AnalyticsCronService = AnalyticsCronService = AnalyticsCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        abc_classification_service_1.AbcClassificationService,
        dead_stock_service_1.DeadStockService,
        reorder_point_service_1.ReorderPointService])
], AnalyticsCronService);
//# sourceMappingURL=analytics-cron.service.js.map