export declare class NotificationService {
    private readonly logger;
    sendEmail(to: string, subject: string, template: string, context: any): Promise<unknown>;
    notifyInvoiceCreated(invoice: any, customerEmail: string): Promise<unknown>;
    notifyPaymentReceived(payment: any, customerEmail: string): Promise<unknown>;
    notifyLowStock(product: any, managerEmail: string): Promise<unknown>;
}
