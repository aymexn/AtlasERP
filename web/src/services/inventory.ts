import { apiFetch } from '@/lib/api';

export interface StockMovement {
  id: string;
  reference: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  warehouseFromId?: string;
  warehouseToId?: string;
  warehouseId?: string;
  reason?: string;
  date: string;
  createdBy?: string;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
  };
  user?: {
    email: string;
  };
  warehouseFrom?: { name: string };
  warehouseTo?: { name: string };
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
}

export interface InventorySummary {
  totalItems: number;
  totalStockValue: number;
  lowStockAlerts: number;
  outOfStock: number;
}

export const inventoryService = {
  listMovements: (): Promise<StockMovement[]> => 
    apiFetch('/inventory/movements'),
  
  createMovement: (data: any): Promise<StockMovement> => 
    apiFetch('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getStock: (warehouseId?: string): Promise<any[]> => 
    apiFetch(`/inventory/stock${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
  
  getProductsStockDashboard: (): Promise<InventorySummary> => 
    apiFetch('/inventory/products-stock'),
  
  getLowStockAlerts: (): Promise<any[]> => 
    apiFetch('/inventory/alerts'),
  
  getProductHistory: (productId: string): Promise<StockMovement[]> => 
    apiFetch(`/inventory/product/${productId}/history`),

  listWarehouses: (): Promise<Warehouse[]> => 
    apiFetch('/warehouses'),
};
