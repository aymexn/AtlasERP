import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/tenant.dto';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(dto: CreateTenantDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }>;
    getMyTenant(req: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }>;
}
