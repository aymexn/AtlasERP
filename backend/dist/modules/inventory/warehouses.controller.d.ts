import { WarehousesService } from './services/warehouses.service';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    listWarehouses(req: any): Promise<{
        id: string;
        name: string;
        companyId: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        location: string | null;
    }[]>;
}
