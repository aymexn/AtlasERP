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
exports.CollectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollectionService = class CollectionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCollectionPriority(companyId) {
        const today = new Date();
        const customers = await this.prisma.customer.findMany({
            where: {
                companyId,
                invoices: {
                    some: { status: { in: ['SENT', 'PARTIAL'] }, dueDate: { lt: today } }
                }
            },
            include: {
                invoices: {
                    where: { status: { in: ['SENT', 'PARTIAL'] }, dueDate: { lt: today } },
                    orderBy: { dueDate: 'asc' }
                },
                collectionActivities: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        const queue = customers.map(customer => {
            const totalOverdue = customer.invoices.reduce((sum, inv) => sum + Number(inv.amountRemaining), 0);
            const oldestInvoice = customer.invoices[0];
            const dueDate = oldestInvoice.dueDate || oldestInvoice.date;
            const daysOverdue = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
            const riskScore = totalOverdue * Math.log(daysOverdue + 1);
            return {
                id: customer.id,
                name: customer.name,
                totalOverdue,
                oldestInvoiceRef: oldestInvoice.reference,
                daysOverdue,
                riskScore,
                lastActivity: customer.collectionActivities[0] || null,
                paymentBehavior: customer.paymentBehavior,
            };
        });
        return queue.sort((a, b) => b.riskScore - a.riskScore);
    }
    async logActivity(companyId, data) {
        return this.prisma.collectionActivity.create({
            data: {
                companyId,
                customerId: data.customerId,
                invoiceId: data.invoiceId,
                activityType: data.activityType,
                notes: data.notes,
                outcome: data.outcome,
                nextAction: data.nextAction ? new Date(data.nextAction) : null,
                assignedTo: data.assignedTo,
            }
        });
    }
    async getActivities(companyId, customerId) {
        return this.prisma.collectionActivity.findMany({
            where: { companyId, customerId },
            orderBy: { createdAt: 'desc' },
            include: { invoice: true }
        });
    }
};
exports.CollectionService = CollectionService;
exports.CollectionService = CollectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollectionService);
//# sourceMappingURL=collection.service.js.map