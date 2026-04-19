import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/tenant.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTenantDto, userId: string): Promise<{
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
    findByUserId(userId: string): Promise<{
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
    updateCompany(userId: string, dto: any): Promise<{
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
