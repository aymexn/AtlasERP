import { apiFetch } from '@/lib/api';

export const dashboardService = {
    getOverview: () => apiFetch('/api/dashboard/overview'),
    getProduction: () => apiFetch('/api/dashboard/production'),
    getFinancial: () => apiFetch('/api/dashboard/financial'),
    getHR: () => apiFetch('/api/dashboard/hr'),
    getLogistics: () => apiFetch('/api/dashboard/logistics'),
    getSales: () => apiFetch('/api/dashboard/sales'),
    getActivity: () => apiFetch('/api/dashboard/activity'),
    getKpis: () => apiFetch('/api/dashboard/kpis'),
    getSalesKpis: () => apiFetch('/api/sales/kpis'),
    refreshKpis: () => apiFetch('/api/dashboard/refresh', { method: 'POST' }),
};
