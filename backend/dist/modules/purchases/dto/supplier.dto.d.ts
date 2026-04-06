export declare class CreateSupplierDto {
    name: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    paymentTermsDays?: number;
    notes?: string;
}
export declare class UpdateSupplierDto extends CreateSupplierDto {
    isActive?: boolean;
}
