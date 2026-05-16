"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let NotificationService = NotificationService_1 = class NotificationService {
    constructor() {
        this.logger = new common_1.Logger(NotificationService_1.name);
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port: Number(process.env.SMTP_PORT) || 2525,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }
    async sendEmail(to, subject, template, context) {
        this.logger.log(`[EMAIL] To: ${to} | Subject: ${subject} | Template: ${template}`);
        if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
            this.logger.error('CRITICAL: SMTP_HOST not configured in production.');
            return;
        }
        try {
            const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #2563eb;">AtlasERP - RH</h2>
          <p>${subject}</p>
          <hr/>
          <pre>${JSON.stringify(context, null, 2)}</pre>
          <hr/>
          <p style="font-size: 12px; color: #999;">Ceci est un message automatique, merci de ne pas répondre.</p>
        </div>
      `;
            if (process.env.SMTP_HOST) {
                await this.transporter.sendMail({
                    from: '"AtlasERP HR" <hr@atlaserp.dz>',
                    to,
                    subject,
                    html,
                });
            }
        }
        catch (error) {
            this.logger.error(`Mail Error: ${error.message}`);
        }
    }
    async notifyLeaveRequested(request, managerEmail) {
        return this.sendEmail(managerEmail, `Nouvelle demande de congé - ${request.employee?.firstName} ${request.employee?.lastName}`, 'leave-requested', {
            employee: `${request.employee?.firstName} ${request.employee?.lastName}`,
            dates: `${request.startDate} au ${request.endDate}`,
            type: request.leaveType?.name
        });
    }
    async notifyLeaveStatusUpdate(request, employeeEmail) {
        return this.sendEmail(employeeEmail, `Statut de votre demande de congé : ${request.status}`, 'leave-status', {
            status: request.status,
            dates: `${request.startDate} au ${request.endDate}`
        });
    }
    async notifyPayrollProcessed(period, employeeEmails) {
        this.logger.log(`Notifying ${employeeEmails.length} employees about payroll ${period.id}`);
        for (const email of employeeEmails) {
            this.sendEmail(email, `Votre bulletin de paie est disponible - ${period.notes || 'Période en cours'}`, 'payroll-ready', { period: period.id }).catch(e => this.logger.error(e));
        }
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
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NotificationService);
//# sourceMappingURL=notifications.service.js.map