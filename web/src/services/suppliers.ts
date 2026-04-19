import { apiFetch } from '@/lib/api';

export interface Supplier {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  taxId?: string;
  nif?: string;
  ai?: string;
  rc?: string;
  paymentTermsDays: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  suppliersWithOrders: {
    id: string;
    name: string;
    _count: { purchaseOrders: number };
  }[];
}

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    return apiFetch('/suppliers');
  },

  async getById(id: string): Promise<Supplier> {
    return apiFetch(`/suppliers/${id}`);
  },

  async getStats(): Promise<SupplierStats> {
    return apiFetch('/suppliers/stats');
  },

  async create(data: Partial<Supplier>): Promise<Supplier> {
    return apiFetch('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return apiFetch(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};
