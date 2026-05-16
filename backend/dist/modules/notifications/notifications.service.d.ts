export declare class NotificationService {
    private readonly logger;
    private transporter;
    constructor();
    sendEmail(to: string, subject: string, template: string, context: any): Promise<void>;
    notifyLeaveRequested(request: any, managerEmail: string): Promise<void>;
    notifyLeaveStatusUpdate(request: any, employeeEmail: string): Promise<void>;
    notifyPayrollProcessed(period: any, employeeEmails: string[]): Promise<void>;
    notifyInvoiceCreated(invoice: any, customerEmail: string): Promise<void>;
    notifyPaymentReceived(payment: any, customerEmail: string): Promise<void>;
    notifyLowStock(product: any, managerEmail: string): Promise<void>;
}
