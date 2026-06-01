import { WarehousesService } from './services/warehouses.service';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    listWarehouses(req: any): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        name: string;
        updatedAt: Date;
        location: string | null;
        code: string | null;
        isActive: boolean;
    }[]>;
}
