import { apiFetch } from '@/lib/api';

export type CustomerSegment = 'A' | 'B' | 'C';
export type CustomerType = 'PROMOTER' | 'WHOLESALER' | 'RETAILER' | 'GOVERNMENT' | 'INDIVIDUAL';
export type PaymentBehavior = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CustomerContact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  notes?: string;
  isPrimary: boolean;
}

export interface CustomerInteraction {
  id: string;
  type: string;
  direction: string;
  subject: string;
  content: string;
  durationMinutes?: number;
  status: string;
  createdAt: string;
}

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
  isBlocked: boolean;
  
  // Intelligence Fields
  segment?: CustomerSegment;
  customerType?: CustomerType;
  paymentBehavior?: PaymentBehavior;
  riskLevel?: RiskLevel;
  totalRevenue?: number;
  avgPaymentDelay?: number;

  // New Dynamic KPIs
  caTotal?: number;
  encours?: number;
  dso?: number;
  computedRisk?: RiskLevel;

  contacts?: CustomerContact[];
  revenueChart?: { month: number; year: number; label: string; revenue: number }[];
  invoices?: any[];
  salesOrders?: any[];
}

export const customersService = {
  async getAll(filters?: any): Promise<Customer[]> {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    return apiFetch(`/customers${queryString ? `?${queryString}` : ''}`);
  },

  async getOne(id: string): Promise<Customer> {
    try {
      const data = await apiFetch(`/customers/${id}/performance`);
      if (data && data.customer) {
        return {
          ...data.customer,
          caTotal: data.kpis?.totalRevenueAllTime || 0,
          encours: data.kpis?.outstandingBalance || 0,
          dso: data.kpis?.avgPaymentDelay || 0,
          revenueChart: data.trend || [],
          salesOrders: data.openOrders || [],
          invoices: data.unpaidInvoices || [],
        };
      }
      return apiFetch(`/customers/${id}`);
    } catch (e) {
      return apiFetch(`/customers/${id}`);
    }
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

  async toggleBlock(id: string): Promise<{ success: boolean; isBlocked: boolean }> {
    return apiFetch(`/customers/${id}/block`, {
      method: 'POST',
    });
  },

  async addContact(id: string, data: Partial<CustomerContact>): Promise<CustomerContact> {
    // Force call Next.js local API directly
    return apiFetch(`/api/customers/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async sendStatement(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/customers/${id}/send-statement`, {
      method: 'POST',
    });
  },

  async getIntelligence(id: string): Promise<any> {
    return apiFetch(`/api/customers/${id}/intelligence`);
  },

  async getFinancialSummary(id: string): Promise<any> {
    return apiFetch(`/api/customers/${id}/financial-summary`);
  },

  async getOrdersAnalysis(id: string): Promise<any> {
    return apiFetch(`/api/customers/${id}/orders/analysis`);
  },

  async getInteractions(id: string): Promise<CustomerInteraction[]> {
    return apiFetch(`/api/customers/${id}/interactions`);
  },

  async createInteraction(id: string, data: Partial<CustomerInteraction>): Promise<CustomerInteraction> {
    return apiFetch(`/api/customers/${id}/interactions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
