export declare class CreateStockReceptionLineDto {
    productId: string;
    purchaseLineId?: string;
    expectedQty: number;
    receivedQty: number;
    unit: string;
    unitCost: number;
    note?: string;
}
export declare class CreateStockReceptionDto {
    purchaseOrderId: string;
    warehouseId: string;
    receivedAt?: string;
    notes?: string;
    lines: CreateStockReceptionLineDto[];
}
