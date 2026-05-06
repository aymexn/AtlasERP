export declare class CreatePurchaseOrderLineDto {
    productId: string;
    quantity: number;
    unit: string;
    unitPriceHt: number;
    taxRate?: number;
    note?: string;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    orderDate: string;
    expectedDate?: string;
    notes?: string;
    lines: CreatePurchaseOrderLineDto[];
    status?: string;
    warehouseId?: string;
}
export declare class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {
}
