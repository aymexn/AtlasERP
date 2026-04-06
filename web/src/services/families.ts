import { apiFetch } from '@/lib/api';

export interface ProductFamily {
    id: string;
    name: string;
    code?: string;
    description?: string;
    parentId?: string;
    parent?: { id: string; name: string };
    colorBadge?: string;
    sortOrder?: number;
    isActive: boolean;
}

export const familiesService = {
    list: async () => {
        return apiFetch('/product-families');
    },
    create: async (data: Partial<ProductFamily>) => {
        return apiFetch('/product-families', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    update: async (id: string, data: Partial<ProductFamily>) => {
        return apiFetch(`/product-families/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
    delete: async (id: string) => {
        return apiFetch(`/product-families/${id}`, {
            method: 'DELETE',
        });
    },
};
