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
exports.PaymentReminderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const date_fns_1 = require("date-fns");
let PaymentReminderService = class PaymentReminderService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async findOverdueInvoices(companyId) {
        const today = new Date();
        const sevenDaysAgo = (0, date_fns_1.subDays)(today, 7);
        return this.prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'PARTIAL'] },
                dueDate: { lt: today },
                OR: [
                    { lastReminderSent: null },
                    { lastReminderSent: { lt: sevenDaysAgo } }
                ]
            },
            include: {
                customer: true
            }
        });
    }
    async sendReminder(invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });
        if (!invoice || !invoice.customer.email)
            return;
        const today = new Date();
        const dueDate = invoice.dueDate || invoice.date;
        const daysOverdue = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
        let template = 'gentle-reminder';
        if (daysOverdue > 30)
            template = 'urgent-reminder';
        if (daysOverdue > 90)
            template = 'final-notice';
        await this.notifications.sendEmail(invoice.customer.email, `Rappel de paiement - Facture ${invoice.reference}`, template, {
            customerName: invoice.customer.name,
            invoiceNumber: invoice.reference,
            amount: invoice.amountRemaining,
            daysOverdue,
            dueDate
        });
        await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                lastReminderSent: new Date(),
                reminderCount: { increment: 1 }
            }
        });
    }
    async sendDailyReminders(companyId) {
        const overdue = await this.findOverdueInvoices(companyId);
        for (const inv of overdue) {
            await this.sendReminder(inv.id);
        }
        return { total: overdue.length };
    }
};
exports.PaymentReminderService = PaymentReminderService;
exports.PaymentReminderService = PaymentReminderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationService])
], PaymentReminderService);
//# sourceMappingURL=payment-reminder.service.js.map