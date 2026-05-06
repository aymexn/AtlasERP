import { renderToStream } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import React from 'react';
import { InvoiceTemplate } from '../pdf/templates/invoice';
import { SalesOrderTemplate } from '../pdf/templates/sales-order';
import { PurchaseOrderTemplate } from '../pdf/templates/purchase-order';
import { DeliveryNoteTemplate } from '../pdf/templates/delivery-note';
import { InventoryReportTemplate } from '../pdf/templates/inventory-report';
import { ExpensesRecapTemplate } from '../pdf/templates/expenses-recap';
import { ClientStatementTemplate } from '../pdf/templates/client-statement';
import { ProductionOrderTemplate } from '../pdf/templates/production-order';
import { SupplierCardTemplate } from '../pdf/templates/supplier-card';
import { CustomerDossierTemplate } from '../pdf/templates/customer-dossier';

/** Recursively convert all Prisma Decimal objects to plain JS numbers */
function sanitizeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDecimals);
  }
  if (obj instanceof Date) return obj;
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      clean[key] = sanitizeDecimals(obj[key]);
    }
    return clean;
  }
  return obj;
}

export class PDFGenerationService {
  
  private static async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    return sanitizeDecimals(company);
  }

  static async generateInvoicePDF(invoiceId: string) {
    try {
      const raw = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          salesOrder: {
            include: {
              lines: {
                include: { product: true }
              }
            }
          }
        }
      });

      if (!raw) throw new Error('Invoice not found');
      const invoice = sanitizeDecimals(raw);
      const company = await this.getCompany(invoice.companyId);

      return await renderToStream(<InvoiceTemplate invoice={invoice} company={company} />);
    } catch (error: any) {
      console.error(`ERREUR PDF Facture : ${error.message}`);
      throw error;
    }
  }

  static async generateSalesOrderPDF(salesOrderId: string) {
    try {
      const raw = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: {
          customer: true,
          lines: {
            include: { product: true }
          }
        }
      });

      if (!raw) throw new Error('Sales Order not found');
      const order = sanitizeDecimals(raw);
      const company = await this.getCompany(order.companyId);

      return await renderToStream(<SalesOrderTemplate order={order} company={company} />);
    } catch (error: any) {
      console.error(`ERREUR PDF Bon de Commande : ${error.message}`);
      throw error;
    }
  }

  static async generatePurchaseOrderPDF(purchaseOrderId: string) {
    try {
      const raw = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          supplier: true,
          lines: {
            include: { product: true }
          }
        }
      });

      if (!raw) throw new Error('Purchase Order not found');
      const order = sanitizeDecimals(raw);
      const company = await this.getCompany(order.companyId);

      return await renderToStream(<PurchaseOrderTemplate order={order} company={company} />);
    } catch (error: any) {
      console.error(`ERREUR PDF BCF : ${error.message}`);
      throw error;
    }
  }

  static async generateDeliveryNotePDF(salesOrderId: string) {
    try {
      const raw = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: {
          customer: true,
          lines: {
            include: { product: true }
          }
        }
      });

      if (!raw) throw new Error('Sales Order not found');
      const order = sanitizeDecimals(raw);
      const company = await this.getCompany(order.companyId);

      return await renderToStream(<DeliveryNoteTemplate order={order} company={company} />);
    } catch (error: any) {
      console.error(`ERREUR PDF Bon de Livraison : ${error.message}`);
      throw error;
    }
  }

  static async generateInventoryPDF(companyId: string) {
    try {
      const rawProducts = await prisma.product.findMany({
        where: { companyId, isActive: true },
        include: { family: true }
      });

      const company = await this.getCompany(companyId);
      const products = sanitizeDecimals(rawProducts);
      const date = new Date().toLocaleDateString('fr-FR');

      return await renderToStream(<InventoryReportTemplate products={products} company={company} date={date} />);
    } catch (error: any) {
      console.error(`ERREUR PDF Inventaire : ${error.message}`);
      throw error;
    }
  }

  static async generateExpensesRecapPDF(companyId: string, startDate?: string, endDate?: string) {
    try {
      const where: any = { companyId };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const rawExpenses = await prisma.expense?.findMany({ where }) || [];
      const company = await this.getCompany(companyId);
      const expenses = sanitizeDecimals(rawExpenses);
      const dateRange = startDate && endDate ? `Du ${startDate} au ${endDate}` : 'Tout historique';

      return await renderToStream(<ExpensesRecapTemplate expenses={expenses} company={company} dateRange={dateRange} />);
    } catch (error: any) {
      console.error(`ERREUR PDF État des Dépenses : ${error.message}`);
      throw error;
    }
  }

  static async generateProductionJobCardPDF(moId: string) {
    try {
      const rawMo = await prisma.manufacturingOrder.findUnique({
        where: { id: moId },
        include: {
          product: true,
          formula: {
            include: {
              components: {
                include: { component: true }
              }
            }
          }
        }
      });

      if (!rawMo) throw new Error('Manufacturing Order not found');
      const mo = sanitizeDecimals(rawMo);
      const company = await this.getCompany(mo.companyId);

      return await renderToStream(<ProductionOrderTemplate mo={mo} company={company} />);
    } catch (error: any) {
      console.error(`ERREUR PDF Fiche Atelier : ${error.message}`);
      throw error;
    }
  }

  static async generateCustomerStatementPDF(customerId: string, startDate?: string, endDate?: string) {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw new Error('Customer not found');

      // Fetch Invoices and Payments for full ledger
      const [rawInvoices, rawPayments] = await Promise.all([
        prisma.invoice.findMany({
          where: { customerId, status: { not: 'CANCELLED' } },
          orderBy: { date: 'asc' }
        }),
        prisma.payment.findMany({
          where: { invoice: { customerId } },
          orderBy: { date: 'asc' }
        })
      ]);

      let balance = 0;
      
      // Combine and sort by date
      const allTransactions = [
        ...rawInvoices.map((inv: any) => ({
          date: inv.date,
          type: 'Facture',
          reference: inv.reference,
          debit: parseFloat(String(inv.totalAmountTtc || 0)),
          credit: 0
        })),
        ...rawPayments.map((pay: any) => ({
          date: pay.date,
          type: 'Paiement',
          reference: pay.reference || 'PAY',
          debit: 0,
          credit: parseFloat(String(pay.amount || 0))
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const transactions = allTransactions.map((t) => {
        balance += (t.debit - t.credit);
        return { ...t, balance };
      });

      const company = await this.getCompany(customer.companyId);
      const dateRange = startDate && endDate ? `Du ${startDate} au ${endDate}` : 'Tout historique';

      return await renderToStream(
        <ClientStatementTemplate 
          customer={sanitizeDecimals(customer)} 
          transactions={sanitizeDecimals(transactions)}
          currentBalance={balance}
          company={company}
          dateRange={dateRange}
        />
      );
    } catch (error: any) {
      console.error(`ERREUR PDF Relevé Client : ${error.message}`);
      throw error;
    }
  }

  static async generateSupplierCardPDF(supplierId: string) {
    try {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) throw new Error('Supplier not found');

      const company = await this.getCompany(supplier.companyId);

      return await renderToStream(
        <SupplierCardTemplate 
          supplier={sanitizeDecimals(supplier)} 
          company={company}
        />
      );
    } catch (error: any) {
      console.error(`ERREUR PDF Fiche Fournisseur : ${error.message}`);
      throw error;
    }
  }

  static async generateCustomerDossierPDF(customerId: string) {
    try {
      // We'll reuse the logic from customers.service to get performance data
      // Since we are in the web layer (Next.js server-side), we can query prisma directly or use a shared logic
      // For simplicity and consistency, let's replicate the logic or call a function if it was shared.
      // Here we query what we need for the PDF.
      
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw new Error('Customer not found');

      const company = await this.getCompany(customer.companyId);

      // Simple version of performance data for PDF
      const [invoices, salesLines] = await Promise.all([
        prisma.invoice.findMany({
          where: { customerId, status: { not: 'CANCELLED' } }
        }),
        prisma.salesOrderLine.findMany({
          where: { salesOrder: { customerId } },
          include: { product: true }
        })
      ]);

      const totalRevenueAllTime = invoices.reduce((acc, inv) => acc + Number(inv.totalAmountHt), 0);
      const outstandingBalance = invoices.reduce((acc, inv) => acc + Number(inv.amountRemaining), 0);

      const productMap = new Map();
      for (const line of salesLines) {
        const existing = productMap.get(line.productId) || { name: line.product.name, sku: line.product.sku, qty: 0, revenue: 0 };
        existing.qty += Number(line.quantity);
        existing.revenue += Number(line.lineTotalHt);
        productMap.set(line.productId, existing);
      }
      const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const kpis = {
        totalRevenueAllTime,
        outstandingBalance,
        avgPaymentDelay: (customer as any).avgPaymentDelay || 0
      };

      return await renderToStream(
        <CustomerDossierTemplate 
          customer={sanitizeDecimals(customer)}
          kpis={kpis}
          topProducts={topProducts}
          company={company}
        />
      );
    } catch (error: any) {
      console.error(`ERREUR PDF Dossier Client : ${error.message}`);
      throw error;
    }
  }
}
