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
exports.SalesOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SalesOrdersService = class SalesOrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        return this.prisma.salesOrder.findMany({
            where: { companyId },
            include: {
                customer: true,
                company: true,
                lines: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(companyId, id) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId },
            include: {
                customer: true,
                company: true,
                lines: {
                    include: {
                        product: true
                    }
                }
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Sales Order not found');
        return order;
    }
    async findOnePublic(id) {
        const order = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: {
                customer: true,
                company: true,
                lines: { include: { product: true } }
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async create(companyId, data) {
        const { customerId, lines, notes } = data;
        let totalAmountHt = new client_1.Prisma.Decimal(0);
        let totalAmountTva = new client_1.Prisma.Decimal(0);
        const formattedLines = lines.map((l) => {
            const qty = new client_1.Prisma.Decimal(l.quantity || 0);
            const price = new client_1.Prisma.Decimal(l.unitPriceHt || 0);
            const taxRate = new client_1.Prisma.Decimal(l.taxRate || 0.19);
            const lineHt = qty.mul(price);
            const lineTva = lineHt.mul(taxRate);
            totalAmountHt = totalAmountHt.add(lineHt);
            totalAmountTva = totalAmountTva.add(lineTva);
            return {
                productId: l.productId,
                quantity: qty,
                unit: l.unit || 'pcs',
                unitPriceHt: price,
                unitCostSnapshot: 0,
                taxRate: taxRate,
                lineTotalHt: lineHt,
                lineTotalTtc: lineHt.add(lineTva),
            };
        });
        const totalAmountTtc = totalAmountHt.add(totalAmountTva);
        const count = await this.prisma.salesOrder.count({ where: { companyId } });
        const reference = `BC-CLI-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        return this.prisma.salesOrder.create({
            data: {
                reference,
                companyId,
                customerId,
                notes,
                totalAmountHt,
                totalAmountTva,
                totalAmountTtc,
                status: 'DRAFT',
                lines: {
                    create: formattedLines,
                },
            },
            include: {
                customer: true,
                lines: true
            }
        });
    }
    async ship(companyId, userId, id) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId },
            include: {
                lines: { include: { product: true } },
                company: true
            }
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status === 'SHIPPED')
            throw new common_1.BadRequestException('Order already shipped');
        return await this.prisma.$transaction(async (tx) => {
            for (const line of order.lines) {
                const prod = line.product;
                const shipQty = new client_1.Prisma.Decimal(line.quantity);
                const currentStock = new client_1.Prisma.Decimal(prod.stockQuantity);
                if (!order.company.allowNegativeStock && currentStock.lt(shipQty)) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${prod.name}. Available: ${currentStock}, Requested: ${shipQty}`);
                }
                const newStockQty = currentStock.minus(shipQty);
                const currentCost = new client_1.Prisma.Decimal(prod.standardCost || 0);
                await tx.product.update({
                    where: { id: prod.id },
                    data: {
                        stockQuantity: newStockQty,
                        stockValue: newStockQty.mul(currentCost),
                    }
                });
                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: prod.id,
                        type: 'OUT',
                        quantity: shipQty,
                        unit: line.unit,
                        unitCost: currentCost,
                        totalCost: shipQty.mul(currentCost),
                        reference: `EXP-CLI-${order.reference}`,
                        reason: `Shipment for Sales Order ${order.reference}`,
                        createdBy: userId,
                        salesOrderId: order.id
                    }
                });
                await tx.salesOrderLine.update({
                    where: { id: line.id },
                    data: {
                        shippedQuantity: shipQty,
                        unitCostSnapshot: currentCost
                    }
                });
            }
            return tx.salesOrder.update({
                where: { id },
                data: { status: 'SHIPPED' }
            });
        });
    }
    async validateOrder(companyId, id) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId }
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT orders can be validated');
        return this.prisma.salesOrder.update({
            where: { id },
            data: { status: 'VALIDATED' }
        });
    }
    async cancelOrder(companyId, id) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId }
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status === 'SHIPPED' || order.status === 'INVOICED') {
            throw new common_1.BadRequestException('Cannot cancel a shipped or invoiced order');
        }
        return this.prisma.salesOrder.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
    async getProfitability(companyId, id) {
        const order = await this.findOne(companyId, id);
        const analysis = order.lines.map(line => {
            const revenue = new client_1.Prisma.Decimal(line.lineTotalHt);
            const cost = new client_1.Prisma.Decimal(line.quantity).mul(new client_1.Prisma.Decimal(line.unitCostSnapshot));
            const margin = revenue.minus(cost);
            const marginPercent = revenue.isZero() ? 0 : margin.div(revenue).mul(100).toNumber();
            return {
                product: line.product.name,
                quantity: line.quantity,
                revenue: revenue.toNumber(),
                cost: cost.toNumber(),
                margin: margin.toNumber(),
                marginPercent
            };
        });
        const totalRevenue = analysis.reduce((acc, curr) => acc + curr.revenue, 0);
        const totalCost = analysis.reduce((acc, curr) => acc + curr.cost, 0);
        const totalMargin = totalRevenue - totalCost;
        return {
            orderId: order.id,
            reference: order.reference,
            totalRevenue,
            totalCost,
            totalMargin,
            marginPercent: totalRevenue === 0 ? 0 : (totalMargin / totalRevenue) * 100,
            details: analysis
        };
    }
};
exports.SalesOrdersService = SalesOrdersService;
exports.SalesOrdersService = SalesOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesOrdersService);
//# sourceMappingURL=sales-orders.service.js.map