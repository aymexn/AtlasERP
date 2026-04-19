import { apiFetch } from '@/lib/api';

export interface ManufacturingOrder {
  id: string;
  reference: string;
  productId: string;
  formulaId: string;
  status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  plannedQuantity: number | string;
  producedQuantity: number | string;
  unit: string;
  plannedDate: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  totalEstimatedCost: number | string;
  totalActualCost?: number | string;
  stockReadiness?: 'READY' | 'PARTIAL' | 'BLOCKING' | 'EXECUTED';
  createdAt: string;
  
  product?: any;
  formula?: any;
  lines?: ManufacturingOrderLine[];
}

export interface ManufacturingOrderLine {
  id: string;
  componentProductId: string;
  requiredQuantity: number | string;
  consumedQuantity: number | string;
  unit: string;
  wastagePercent: number | string;
  estimatedUnitCost: number | string;
  estimatedLineCost: number | string;
  
  component?: any;
  
  // Frontend extras from live stock check
  availableStock?: number;
  shortageQuantity?: number;
  stockStatus?: 'ENOUGH' | 'LOW' | 'INSUFFICIENT';
}

export const manufacturingOrdersService = {
  async getAll(status?: string): Promise<ManufacturingOrder[]> {
    const url = status ? `/manufacturing-orders?status=${status}` : '/manufacturing-orders';
    return apiFetch(url);
  },

  async getById(id: string): Promise<ManufacturingOrder> {
    return apiFetch(`/manufacturing-orders/${id}`);
  },

  async create(data: { productId: string; formulaId: string; plannedQuantity: number; plannedDate: string; notes?: string }): Promise<ManufacturingOrder> {
    return apiFetch('/manufacturing-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: { notes?: string; plannedDate?: string }): Promise<ManufacturingOrder> {
    return apiFetch(`/manufacturing-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async plan(id: string): Promise<ManufacturingOrder> {
    return apiFetch(`/manufacturing-orders/${id}/plan`, { method: 'POST' });
  },

  async start(id: string): Promise<ManufacturingOrder> {
    return apiFetch(`/manufacturing-orders/${id}/start`, { method: 'POST' });
  },

  async complete(id: string, producedQuantity: number): Promise<ManufacturingOrder> {
    return apiFetch(`/manufacturing-orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ producedQuantity }),
    });
  },

  async cancel(id: string): Promise<ManufacturingOrder> {
    return apiFetch(`/manufacturing-orders/${id}/cancel`, { method: 'POST' });
  },
  getPdfUrl(id: string) {
    return `/manufacturing-orders/${id}/pdf`;
  }
};
