import { apiFetch } from '@/lib/api';

export interface Product {
    id: string;
    name: string;
    sku: string;
    secondaryName?: string | null;
    articleType: string;
    unit: string;
    salePriceHt: number;
    taxRate: number;
    purchasePriceHt?: number | null;
    standardCost: number;
    stockQuantity: number;
    minStock: number;
    maxStock?: number | null;
    trackStock: boolean;
    isActive: boolean;
    description?: string | null;
    familyId?: string | null;
    family?: {
        id: string;
        name: string;
    } | null;
    formulas?: any[] | null;
    stockMovements?: any[] | null;
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

    async create(data: Partial<Product> & { formulaLines?: any[] }) {
        // Now calling the local unified API for atomic creation
        return apiFetch('/api/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Product> & { formulaLines?: any[] }) {
        // Now calling the local unified API for atomic update
        return apiFetch(`/api/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return apiFetch(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    async saveBOM(productId: string, data: any) {
        return apiFetch(`/api/products/${productId}/bom`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getBOM(productId: string) {
        return apiFetch(`/api/products/${productId}/bom`);
    },

    async recalculateCost(id: string) {
        return apiFetch(`/products/${id}/recalculate-cost`, {
            method: 'POST',
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
    },

    // UoM Methods
    async getUoms() {
        return apiFetch('/uoms');
    },

    async getProductUoms(productId: string) {
        return apiFetch(`/uoms/product/${productId}`);
    },

    async addProductUom(productId: string, data: any) {
        return apiFetch(`/uoms/product/${productId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async removeProductUom(id: string) {
        return apiFetch(`/uoms/product/${id}`, {
            method: 'DELETE',
        });
    },

    // Variants Methods
    async getVariants(productId: string) {
        return apiFetch(`/products/${productId}/variants`);
    },

    async generateVariantMatrix(productId: string, attributes: any) {
        return apiFetch(`/products/${productId}/variants/matrix`, {
            method: 'POST',
            body: JSON.stringify(attributes),
        });
    },

    async updateVariant(productId: string, variantId: string, data: any) {
        return apiFetch(`/products/${productId}/variants/${variantId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Supplier Catalog Methods
    async getSupplierCatalog(supplierId: string) {
        return apiFetch(`/suppliers/${supplierId}/products`);
    },

    async addProductToSupplier(supplierId: string, data: any) {
        return apiFetch(`/suppliers/${supplierId}/products`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async removeSupplierProduct(id: string) {
        return apiFetch(`/suppliers/products/${id}`, {
            method: 'DELETE',
        });
    }
};
