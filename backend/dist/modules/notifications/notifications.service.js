"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor() {
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendEmail(to, subject, template, context) {
        this.logger.log(`[EMAIL SIMULATOR] To: ${to} | Subject: ${subject}`);
        return new Promise((resolve) => setTimeout(resolve, 100));
    }
    async notifyInvoiceCreated(invoice, customerEmail) {
        return this.sendEmail(customerEmail, `Facture ${invoice.reference} - AtlasERP`, 'invoice-created', { reference: invoice.reference, amount: invoice.totalAmountTtc });
    }
    async notifyPaymentReceived(payment, customerEmail) {
        return this.sendEmail(customerEmail, `Reçu de Paiement ${payment.id} - AtlasERP`, 'payment-received', { amount: payment.amount, date: payment.createdAt });
    }
    async notifyLowStock(product, managerEmail) {
        return this.sendEmail(managerEmail, `ALERTE STOCK BAS: ${product.name}`, 'low-stock-alert', { name: product.name, current: product.stockQuantity, min: product.minStock });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notifications.service.js.map