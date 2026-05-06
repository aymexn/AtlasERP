import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendEmail(to: string, subject: string, template: string, context: any) {
    this.logger.log(`[EMAIL SIMULATOR] To: ${to} | Subject: ${subject}`);
    // In production, use nodemailer or a service like SendGrid/AWS SES
    // console.log('Template Context:', context);
    
    // Simulate async operation
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

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
