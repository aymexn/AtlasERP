import { apiFetch } from '../lib/api';

// Simplified alias to match user expectation while keeping our robust implementation
const api = {
    get: (url: string) => apiFetch(url, { method: 'GET' }),
    post: (url: string, data: any) => apiFetch(url, { method: 'POST', body: JSON.stringify(data) }),
    put: (url: string, data: any) => apiFetch(url, { method: 'PUT', body: JSON.stringify(data) }),
    patch: (url: string, data: any) => apiFetch(url, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (url: string) => apiFetch(url, { method: 'DELETE' }),
};

export default api;
