import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/tenant.dto';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(dto: CreateTenantDto, req: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        name: string;
        slug: string;
        address: string | null;
        phone: string | null;
        website: string | null;
        logoUrl: string | null;
        nif: string | null;
        ai: string | null;
        rc: string | null;
        rib: string | null;
        allowNegativeStock: boolean;
    }>;
    getMyTenant(req: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        name: string;
        slug: string;
        address: string | null;
        phone: string | null;
        website: string | null;
        logoUrl: string | null;
        nif: string | null;
        ai: string | null;
        rc: string | null;
        rib: string | null;
        allowNegativeStock: boolean;
    }>;
    updateMyTenant(dto: any, req: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        name: string;
        slug: string;
        address: string | null;
        phone: string | null;
        website: string | null;
        logoUrl: string | null;
        nif: string | null;
        ai: string | null;
        rc: string | null;
        rib: string | null;
        allowNegativeStock: boolean;
    }>;
}
