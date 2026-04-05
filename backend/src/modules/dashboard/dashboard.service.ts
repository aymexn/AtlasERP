import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManufacturingOrderStatus, ArticleType } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getProductionStats(companyId: string) {
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

        const activeStatuses: ManufacturingOrderStatus[] = ['PLANNED', 'IN_PROGRESS'];
        
        let totalEstimatedCost = 0;
        let totalActualCost = 0;
        let finishedGoodsProduced = 0;
        let rawMaterialsConsumedCount = 0;
        let componentsInShortage = new Set<string>();

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

        // Urgent low stock items (used in formulas and below min stock)
        const lowStockComponents = await this.prisma.product.count({
            where: {
                companyId,
                stockQuantity: { lt: this.prisma.product.fields.minStock },
                formulaComponents: { some: {} } // Used in at least one formula
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
}
