export declare class CreateManufacturingOrderDto {
    productId: string;
    formulaId: string;
    variantId?: string;
    plannedQuantity: number;
    plannedDate: string;
    notes?: string;
    warehouseId?: string;
}
export declare class UpdateManufacturingOrderDto {
    plannedDate?: string;
    notes?: string;
}
export declare class CompleteManufacturingOrderDto {
    producedQuantity: number;
}
