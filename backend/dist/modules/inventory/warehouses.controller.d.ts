import { WarehousesService } from './services/warehouses.service';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    listWarehouses(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        name: string;
        isActive: boolean;
        code: string | null;
        location: string | null;
    }[]>;
}
