export declare class CreateFormulaLineDto {
    componentProductId: string;
    quantity: number;
    unit: string;
    wastagePercent?: number;
    sortOrder?: number;
    note?: string;
}
export declare class UpdateFormulaLineDto {
    quantity?: number;
    unit?: string;
    wastagePercent?: number;
    sortOrder?: number;
    note?: string;
}
export declare class CreateFormulaDto {
    name: string;
    version?: string;
    code?: string;
    description?: string;
    outputQuantity: number;
    outputUnit: string;
    scrapPercent?: number;
    status?: string;
    isActive?: boolean;
    lines?: CreateFormulaLineDto[];
}
export declare class UpdateFormulaDto {
    name?: string;
    version?: string;
    code?: string;
    description?: string;
    outputQuantity?: number;
    outputUnit?: string;
    scrapPercent?: number;
    status?: string;
    isActive?: boolean;
    lines?: CreateFormulaLineDto[];
}
