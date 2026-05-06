import { apiFetch } from '@/lib/api';

export type CustomerSegment = 'A' | 'B' | 'C';
export type CustomerType = 'PROMOTER' | 'WHOLESALER' | 'RETAILER' | 'GOVERNMENT' | 'INDIVIDUAL';
export type PaymentBehavior = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

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
  
  // Intelligence Fields
  segment?: CustomerSegment;
  customerType?: CustomerType;
  paymentBehavior?: PaymentBehavior;
  riskLevel?: RiskLevel;
  totalRevenue?: number;
  avgPaymentDelay?: number;
}

export interface CustomerPerformance {
  customer: Customer;
  kpis: {
    totalRevenueAllTime: number;
    totalRevenueThisYear: number;
    outstandingBalance: number;
    avgPaymentDelay: number;
    segment?: CustomerSegment;
    paymentBehavior?: PaymentBehavior;
    riskLevel?: RiskLevel;
  };
  trend: { month: string; revenue: number }[];
  topProducts: { name: string; sku: string; qty: number; revenue: number }[];
  openOrders: { id: string; reference: string; status: string; date: string; totalAmountTtc: number }[];
  unpaidInvoices: { id: string; reference: string; date: string; totalAmountTtc: number; amountRemaining: number; status: string }[];
}

export const customersService = {
  async getAll(filters?: any): Promise<Customer[]> {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    return apiFetch(`/customers${queryString ? `?${queryString}` : ''}`);
  },

  async getOne(id: string): Promise<Customer> {
    return apiFetch(`/customers/${id}`);
  },

  async getPerformance(id: string): Promise<CustomerPerformance> {
    return apiFetch(`/customers/${id}/performance`);
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
