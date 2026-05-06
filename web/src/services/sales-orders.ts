import { apiFetch } from '@/lib/api';

export type SalesOrderStatus = 'DRAFT' | 'VALIDATED' | 'PREPARING' | 'SHIPPED' | 'INVOICED' | 'CANCELLED';

export interface SalesOrderLine {
  id: string;
  productId: string;
  product: { name: string; sku: string; stockQuantity: number };
  quantity: number;
  shippedQuantity: number;
  unit: string;
  unitPriceHt: number;
  unitCostSnapshot: number;
  lineTotalHt: number;
  lineTotalTtc: number;
}

export interface SalesOrder {
  id: string;
  reference: string;
  customerId: string;
  customer?: { name: string };
  status: SalesOrderStatus;
  date: string;
  totalAmountHt: number;
  totalAmountTva: number;
  totalAmountTtc: number;
  notes?: string;
  lines: SalesOrderLine[];
  invoice?: { id: string; reference: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProfitabilityDetails {
  product: string;
  quantity: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
}

export interface ProfitabilityReport {
  orderId: string;
  reference: string;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercent: number;
  details: ProfitabilityDetails[];
}

export const salesOrdersService = {
  async getAll(): Promise<SalesOrder[]> {
    return apiFetch('/sales-orders');
  },

  async getOne(id: string): Promise<SalesOrder> {
    return apiFetch(`/sales-orders/${id}`);
  },

  async create(data: any): Promise<SalesOrder> {
    return apiFetch('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async ship(id: string): Promise<SalesOrder> {
    return apiFetch(`/sales-orders/${id}/ship`, {
      method: 'POST',
    });
  },
  
  async validate(id: string): Promise<SalesOrder> {
    return apiFetch(`/sales-orders/${id}/validate`, {
      method: 'PATCH',
    });
  },

  async cancel(id: string): Promise<SalesOrder> {
    return apiFetch(`/sales-orders/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  async getProfitability(id: string): Promise<ProfitabilityReport> {
    return apiFetch(`/sales-orders/${id}/profitability`);
  },
  getPdfUrl(id: string) {
    return `/api/pdf/sales-order/${id}`;
  },
  getDeliveryNoteUrl(id: string) {
    return `/api/pdf/delivery-note/${id}`;
  }
};
