export declare enum MovementType {
    IN = "IN",
    OUT = "OUT",
    TRANSFER = "TRANSFER",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare class CreateStockMovementDto {
    reference?: string;
    productId: string;
    variantId?: string;
    type: MovementType;
    quantity: number;
    unit: string;
    unitCost?: number;
    warehouseId?: string;
    warehouseFromId?: string;
    warehouseToId?: string;
    sourceLocation?: string;
    destinationLocation?: string;
    uomId?: string;
    reason?: string;
    date?: string;
}
