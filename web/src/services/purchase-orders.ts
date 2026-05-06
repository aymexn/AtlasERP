import { apiFetch } from '@/lib/api';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED' | 'INVOICED';

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  quantity: number | string;
  receivedQuantity: number | string;
  unit: string;
  unitPriceHt: number | string;
  taxRate: number | string;
  lineTotalHt: number | string;
  lineTotalTtc: number | string;
  product?: any;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  reference: string;
  status: PurchaseOrderStatus;
  date: string;
  expectedDate?: string;
  totalAmountHt: number | string;
  totalAmountTva: number | string;
  totalAmountTtc: number | string;
  notes?: string;
  supplier?: {
    name: string;
  };
  lines?: PurchaseOrderLine[];
}

export const purchaseOrdersService = {
  async getAll(): Promise<PurchaseOrder[]> {
    return apiFetch('/purchase-orders');
  },

  async getById(id: string): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}`);
  },

  async create(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return apiFetch('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async receive(id: string): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}/receive`, {
      method: 'POST',
    });
  },

  async generateFromShortages(): Promise<{ createdPOs: number; message: string }> {
    return apiFetch('/purchase-orders/generate-from-shortages', {
      method: 'POST',
    });
  },
  getPdfUrl(id: string) {
    return `/api/pdf/purchase-order/${id}`;
  }
};
