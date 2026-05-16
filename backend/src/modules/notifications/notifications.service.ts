import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io', // Default for dev
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(to: string, subject: string, template: string, context: any) {
    this.logger.log(`[EMAIL] To: ${to} | Subject: ${subject} | Template: ${template}`);
    
    if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
        this.logger.error('CRITICAL: SMTP_HOST not configured in production.');
        return;
    }

    try {
      // In production, you'd use a real template engine like Handlebars or EJS
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
    } catch (error) {
      this.logger.error(`Mail Error: ${error.message}`);
    }
  }

  // --- HR Notifications ---

  async notifyLeaveRequested(request: any, managerEmail: string) {
    return this.sendEmail(
      managerEmail,
      `Nouvelle demande de congé - ${request.employee?.firstName} ${request.employee?.lastName}`,
      'leave-requested',
      { 
        employee: `${request.employee?.firstName} ${request.employee?.lastName}`,
        dates: `${request.startDate} au ${request.endDate}`,
        type: request.leaveType?.name
      }
    );
  }

  async notifyLeaveStatusUpdate(request: any, employeeEmail: string) {
    return this.sendEmail(
      employeeEmail,
      `Statut de votre demande de congé : ${request.status}`,
      'leave-status',
      { 
        status: request.status,
        dates: `${request.startDate} au ${request.endDate}`
      }
    );
  }

  async notifyPayrollProcessed(period: any, employeeEmails: string[]) {
    this.logger.log(`Notifying ${employeeEmails.length} employees about payroll ${period.id}`);
    for (const email of employeeEmails) {
        this.sendEmail(
            email,
            `Votre bulletin de paie est disponible - ${period.notes || 'Période en cours'}`,
            'payroll-ready',
            { period: period.id }
        ).catch(e => this.logger.error(e));
    }
  }

  // --- Other Notifications ---

  async notifyInvoiceCreated(invoice: any, customerEmail: string) {
    return this.sendEmail(
      customerEmail,
      `Facture ${invoice.reference} - AtlasERP`,
      'invoice-created',
      { reference: invoice.reference, amount: invoice.totalAmountTtc }
    );
  }

  async notifyPaymentReceived(payment: any, customerEmail: string) {
    return this.sendEmail(
      customerEmail,
      `Reçu de Paiement ${payment.id} - AtlasERP`,
      'payment-received',
      { amount: payment.amount, date: payment.createdAt }
    );
  }

  async notifyLowStock(product: any, managerEmail: string) {
    return this.sendEmail(
      managerEmail,
      `ALERTE STOCK BAS: ${product.name}`,
      'low-stock-alert',
      { name: product.name, current: product.stockQuantity, min: product.minStock }
    );
  }
}
