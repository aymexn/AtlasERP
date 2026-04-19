import { apiFetch } from '@/lib/api';

export interface Product {
    id: string;
    name: string;
    sku: string;
    secondaryName?: string;
    articleType: 'RAW_MATERIAL' | 'FINISHED_PRODUCT' | 'SEMI_FINISHED' | 'PACKAGING' | 'SERVICE';
    unit: string;
    salePriceHt: number;
    taxRate: number;
    purchasePriceHt?: number;
    standardCost: number;
    stockQuantity: number;
    minStock: number;
    maxStock?: number;
    trackStock: boolean;
    isActive: boolean;
    description?: string;
    familyId?: string;
    family?: {
        id: string;
        name: string;
    };
    formulas?: any[];
    stockMovements?: any[];
    createdAt: string;
    updatedAt: string;
}

export const productsService = {
    async list() {
        return apiFetch('/products');
    },

    async get(id: string) {
        return apiFetch(`/products/${id}`);
    },

    async create(data: Partial<Product>) {
        return apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Product>) {
        return apiFetch(`/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return apiFetch(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    // Formula / BOM methods
    async getProductFormulas(productId: string) {
        return apiFetch(`/formulas/product/${productId}`);
    },

    async getFormula(id: string) {
        return apiFetch(`/formulas/${id}`);
    },

    async createFormula(productId: string, data: any) {
        return apiFetch(`/formulas/product/${productId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateFormula(id: string, data: any) {
        return apiFetch(`/formulas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async activateFormula(id: string) {
        return apiFetch(`/formulas/${id}/activate`, {
            method: 'POST',
        });
    },

    async archiveFormula(id: string) {
        return apiFetch(`/formulas/${id}`, {
            method: 'DELETE',
        });
    },

    async addFormulaLine(formulaId: string, data: any) {
        return apiFetch(`/formulas/${formulaId}/lines`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateFormulaLine(lineId: string, data: any) {
        return apiFetch(`/formulas/lines/${lineId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async removeFormulaLine(lineId: string) {
        return apiFetch(`/formulas/lines/${lineId}`, {
            method: 'DELETE',
        });
    },

    getInventoryPdfUrl() {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products/export/pdf`;
    }
};
