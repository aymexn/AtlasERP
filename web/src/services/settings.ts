import { apiFetch } from '@/lib/api';

export interface CompanySettings {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    nif?: string;
    ai?: string;
    rc?: string;
    rib?: string;
    logoUrl?: string;
}

export const settingsService = {
    getCompany: async () => {
        return apiFetch('/tenants/me');
    },
    updateCompany: async (data: CompanySettings) => {
        return apiFetch('/tenants/me', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
