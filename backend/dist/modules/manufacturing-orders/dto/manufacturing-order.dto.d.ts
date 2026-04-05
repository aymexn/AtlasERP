export declare class CreateManufacturingOrderDto {
    productId: string;
    formulaId: string;
    plannedQuantity: number;
    plannedDate: string;
    notes?: string;
}
export declare class UpdateManufacturingOrderDto {
    plannedDate?: string;
    notes?: string;
}
export declare class CompleteManufacturingOrderDto {
    producedQuantity: number;
}
