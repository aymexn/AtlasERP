import { apiFetch } from '@/lib/api';

export const invoicesService = {
  async findAll() {
    return apiFetch('/invoices');
  },

  async findOne(id: string) {
    return apiFetch(`/invoices/${id}`);
  },

  async createFromSalesOrder(salesOrderId: string, paymentMethod: string) {
    return apiFetch('/invoices/from-sales-order', {
      method: 'POST',
      body: JSON.stringify({ salesOrderId, paymentMethod }),
    });
  },

  async cancel(id: string) {
    return apiFetch(`/invoices/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  getInvoicePdfUrl(id: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}/invoices/${id}/pdf`;
  }
};
