import { apiFetch } from '@/lib/api';

export const dashboardService = {
  async getProductionStats() {
    return apiFetch('/dashboard/production-stats');
  },
  
  async getFinancialStats() {
    return apiFetch('/dashboard/financial-stats');
  }
};
