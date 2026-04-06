import { apiFetch } from '@/lib/api';

export interface Customer {
  id: string;
  name: string;
  contact?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  isActive: boolean;
}

export const customersService = {
  async getAll(): Promise<Customer[]> {
    return apiFetch('/customers');
  },

  async getOne(id: string): Promise<Customer> {
    return apiFetch(`/customers/${id}`);
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    return apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return apiFetch(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
