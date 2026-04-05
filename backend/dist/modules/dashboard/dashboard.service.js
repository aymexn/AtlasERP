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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProductionStats(companyId) {
        const orders = await this.prisma.manufacturingOrder.findMany({
            where: { companyId },
            include: {
                lines: {
                    include: {
                        component: {
                            select: {
                                stockQuantity: true,
                                minStock: true
                            }
                        }
                    }
                }
            }
        });
        const activeStatuses = ['PLANNED', 'IN_PROGRESS'];
        let totalEstimatedCost = 0;
        let totalActualCost = 0;
        let finishedGoodsProduced = 0;
        let rawMaterialsConsumedCount = 0;
        let componentsInShortage = new Set();
        orders.forEach(order => {
            totalEstimatedCost += Number(order.totalEstimatedCost || 0);
            totalActualCost += Number(order.totalActualCost || 0);
            finishedGoodsProduced += Number(order.producedQuantity || 0);
            order.lines.forEach(line => {
                if (Number(line.consumedQuantity) > 0) {
                    rawMaterialsConsumedCount++;
                }
                const required = Number(line.requiredQuantity);
                const available = Number(line.component.stockQuantity);
                if (available < required) {
                    componentsInShortage.add(line.componentProductId);
                }
            });
        });
        const lowStockComponents = await this.prisma.product.count({
            where: {
                companyId,
                stockQuantity: { lt: this.prisma.product.fields.minStock },
                formulaComponents: { some: {} }
            }
        });
        return {
            orders: {
                active: orders.filter(o => activeStatuses.includes(o.status)).length,
                planned: orders.filter(o => o.status === 'PLANNED').length,
                inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
                completed: orders.filter(o => o.status === 'COMPLETED').length,
                draft: orders.filter(o => o.status === 'DRAFT').length
            },
            costs: {
                estimated: totalEstimatedCost,
                actual: totalActualCost,
                variance: totalActualCost - totalEstimatedCost
            },
            inventory: {
                shortageCount: componentsInShortage.size,
                lowStockUrgent: lowStockComponents,
                producedCount: finishedGoodsProduced
            }
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map