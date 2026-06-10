import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/tenant.dto';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(dto: CreateTenantDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        name: string;
        address: string | null;
        phone: string | null;
        slug: string;
        ai: string | null;
        allowNegativeStock: boolean;
        logoUrl: string | null;
        nif: string | null;
        nis: string | null;
        rc: string | null;
        rib: string | null;
        website: string | null;
    }>;
    getMyTenant(req: any): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        name: string;
        address: string | null;
        phone: string | null;
        slug: string;
        ai: string | null;
        allowNegativeStock: boolean;
        logoUrl: string | null;
        nif: string | null;
        nis: string | null;
        rc: string | null;
        rib: string | null;
        website: string | null;
    }>;
    updateMyTenant(dto: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        name: string;
        address: string | null;
        phone: string | null;
        slug: string;
        ai: string | null;
        allowNegativeStock: boolean;
        logoUrl: string | null;
        nif: string | null;
        nis: string | null;
        rc: string | null;
        rib: string | null;
        website: string | null;
    }>;
}
