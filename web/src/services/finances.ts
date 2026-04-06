import { apiFetch } from '@/lib/api';

export const paymentsService = {
  async findAll() {
    return apiFetch('/payments');
  },

  async recordPayment(data: { invoiceId: string; amount: number; method: string; date?: string; reference?: string; notes?: string }) {
    return apiFetch('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

export const expensesService = {
  async findAll() {
    return apiFetch('/expenses');
  },

  async findOne(id: string) {
    return apiFetch(`/expenses/${id}`);
  },

  async getStats() {
    return apiFetch('/expenses/stats');
  },

  async create(data: { title: string; amount: number; category: string; date?: string; paymentMethod: string; supplierId?: string; reference?: string; notes?: string }) {
    return apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return apiFetch(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }
};
