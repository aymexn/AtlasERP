import { apiFetch } from '@/lib/api';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';
export type ReceptionStatus = 'DRAFT' | 'VALIDATED';

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  product?: { name: string; sku: string };
  quantity: number;
  unit: string;
  unitPriceHt: number;
  taxRate: number;
  totalHt: number;
  receivedQty: number;
  note?: string;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: string;
  supplier?: { name: string; id: string };
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  notes?: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  createdAt: string;
  updatedAt: string;
  lines?: PurchaseOrderLine[];
  stockReceptions?: StockReception[];
  _count?: {
    lines: number;
    stockReceptions: number;
  };
}

export interface StockReceptionLine {
  id: string;
  productId: string;
  product?: { name: string; sku: string };
  purchaseLineId?: string;
  expectedQty: number;
  receivedQty: number;
  unit: string;
  unitCost: number;
  note?: string;
}

export interface StockReception {
  id: string;
  reference: string;
  purchaseOrderId: string;
  purchaseOrder?: { reference: string; supplier: { name: string } };
  warehouseId: string;
  warehouse?: { name: string };
  status: ReceptionStatus;
  receivedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines?: StockReceptionLine[];
}

export const purchasesService = {
  // Purchase Orders
  async getAllOrders(status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const url = status ? `/purchase-orders?status=${status}` : '/purchase-orders';
    return apiFetch(url);
  },

  async getOrderById(id: string): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}`);
  },

  async createOrder(data: any): Promise<PurchaseOrder> {
    return apiFetch('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrder(id: string, data: any): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async confirmOrder(id: string): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}/confirm`, { method: 'POST' });
  },

  async sendOrder(id: string): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}/send`, { method: 'POST' });
  },

  async cancelOrder(id: string): Promise<PurchaseOrder> {
    return apiFetch(`/purchase-orders/${id}/cancel`, { method: 'POST' });
  },

  async createReception(id: string, warehouseId: string, notes?: string): Promise<StockReception> {
    return apiFetch(`/purchase-orders/${id}/create-reception`, {
      method: 'POST',
      body: JSON.stringify({ warehouseId, notes }),
    });
  },

  // Stock Receptions
  async getAllReceptions(): Promise<StockReception[]> {
    return apiFetch('/stock-receptions');
  },

  async getReceptionById(id: string): Promise<StockReception> {
    return apiFetch(`/stock-receptions/${id}`);
  },

  async validateReception(id: string): Promise<StockReception> {
    return apiFetch(`/stock-receptions/${id}/validate`, { method: 'POST' });
  },
  
  async updateReception(id: string, data: any): Promise<StockReception> {
    return apiFetch(`/stock-receptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getPdfUrl(id: string) {
    return `/api/pdf/purchase-order/${id}`;
  },

  getReceptionPdfUrl(id: string) {
    return `/api/pdf/delivery-note/${id}`; // Mapping reception to delivery note template logic
  }
};
