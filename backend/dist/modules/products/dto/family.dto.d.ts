export declare class CreateFamilyDto {
    name: string;
    code?: string;
    description?: string;
    colorBadge?: string;
    sortOrder?: number;
    parentId?: string;
    isActive?: boolean;
}
export declare class UpdateFamilyDto {
    name?: string;
    code?: string;
    description?: string;
    colorBadge?: string;
    sortOrder?: number;
    parentId?: string;
    isActive?: boolean;
}
