import { apiFetch } from '@/lib/api';

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'VALIDATED' | 'PREPARING' | 'SHIPPED' | 'INVOICED' | 'CANCELLED';

export interface SalesOrderLine {
  id: string;
  productId: string;
  product: { 
    id: string; 
    name: string; 
    sku: string; 
    stockQuantity: number; 
    stockReserved: number;
    standardCost: number;
    salePriceHt?: number;
  };
  quantity: number;
  shippedQuantity: number;
  unit: string;
  unitPriceHt: number;
  unitCostSnapshot: number;
  discountPercent: number;
  lineTotalHt: number;
  lineTotalTtc: number;
}

export interface SalesOrder {
  id: string;
  reference: string;
  customerId: string;
  customer?: { id: string; name: string };
  status: SalesOrderStatus;
  date: string;
  dueDate?: string | null;
  totalAmountHt: number;
  totalAmountTva: number;
  totalAmountTtc: number;
  shippingCost: number;
  discountPercent: number;
  notes?: string;
  internalNotes?: string;
  validatedAt?: string | null;
  shippedAt?: string | null;
  cancelledAt?: string | null;
  lines: SalesOrderLine[];
  invoice?: { id: string; reference: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
  profitability?: ProfitabilityReport;
}

export interface ProfitabilityDetails {
  productId: string;
  product: string;
  quantity: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
}

export interface ProfitabilityReport {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercent: number;
  details: ProfitabilityDetails[];
}

export interface CreateOrderInput {
  customerId: string;
  dueDate?: string;
  notes?: string;
  internalNotes?: string;
  shippingCost?: number;
  discountPercent?: number;
  lines: {
    productId: string;
    quantity: number;
    unitPriceHt: number;
    discountPercent?: number;
  }[];
}

// All routes now use the Next.js API routes at /api/sales/orders
const BASE = '/api/sales/orders';

export const salesOrdersService = {
  async getAll(filters?: { status?: string; customerId?: string; dateFrom?: string; dateTo?: string; search?: string }): Promise<SalesOrder[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return apiFetch(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  async getOne(id: string): Promise<SalesOrder> {
    return apiFetch(`${BASE}/${id}`);
  },

  async create(data: CreateOrderInput): Promise<SalesOrder> {
    return apiFetch(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async validate(id: string): Promise<SalesOrder> {
    return apiFetch(`${BASE}/${id}/validate`, { method: 'POST' });
  },

  async ship(id: string): Promise<SalesOrder> {
    return apiFetch(`${BASE}/${id}/ship`, { method: 'POST' });
  },

  async cancel(id: string): Promise<SalesOrder> {
    return apiFetch(`${BASE}/${id}/cancel`, { method: 'POST' });
  },

  getPdfUrl(id: string) {
    return `/api/pdf/sales-order/${id}`;
  },

  getDeliveryNoteUrl(id: string) {
    return `/api/pdf/delivery-note/${id}`;
  }
};

