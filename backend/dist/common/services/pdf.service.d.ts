export declare class PdfService {
    private toNumber;
    private formatAmount;
    private str;
    generateInvoicePdf(invoice: any, res: any): Promise<void>;
    generateSalesOrderPdf(order: any, res: any): Promise<void>;
    generatePurchaseOrderPdf(order: any, res: any): Promise<void>;
    generateWorkOrderPdf(order: any, res: any): Promise<void>;
    generateInventoryPdf(company: any, products: any[], res: any): Promise<void>;
    generateSupplierPdf(company: any, supplier: any, res: any): Promise<void>;
    generateExpensesPdf(company: any, expenses: any[], res: any): Promise<void>;
    private drawOfficialHeader;
    private drawFooter;
    private generateDocument;
    private generateLine;
}
