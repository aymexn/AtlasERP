import { apiFetch } from '@/lib/api';

export interface AnalyticsKPI {
  revenue: number;
  revenueChange: number;
  margin: number;
  activeOrders: number;
  stockOutRate: number;
}

export interface ImminentRupture {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unit: string;
  velocity: string;
  daysRemaining: number;
  predictionDate: string;
}

export const analyticsService = {
  async getKPIs(period: string = 'month'): Promise<AnalyticsKPI> {
    return apiFetch(`/analytics/kpi?period=${period}`);
  },

  async getImminentRupture(): Promise<ImminentRupture[]> {
    return apiFetch('/analytics/alerts/imminent-rupture');
  },

  async getSurstock(): Promise<any[]> {
    return apiFetch('/analytics/alerts/surstock');
  },

  async getPaymentDelays(): Promise<any[]> {
    return apiFetch('/analytics/alerts/payment-delays');
  },

  async getProductionBottlenecks(): Promise<any[]> {
    return apiFetch('/analytics/alerts/production-bottlenecks');
  },

  async getRevenueEvolution(days: number = 30): Promise<any[]> {
    return apiFetch(`/analytics/charts/revenue-evolution?days=${days}`);
  },

  async getTopProducts(limit: number = 5): Promise<any[]> {
    return apiFetch(`/analytics/charts/top-products?limit=${limit}`);
  },

  async getCategoryDistribution(): Promise<any[]> {
    return apiFetch('/analytics/charts/category-distribution');
  },

  async getRecentTransactions(limit: number = 10): Promise<any[]> {
    return apiFetch(`/analytics/recent-transactions?limit=${limit}`);
  },

  async getAbcSummary(): Promise<any> {
    return apiFetch('/analytics/abc/summary');
  }
};
