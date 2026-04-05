import { WarehousesService } from './services/warehouses.service';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    listWarehouses(req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        location: string | null;
    }[]>;
}
