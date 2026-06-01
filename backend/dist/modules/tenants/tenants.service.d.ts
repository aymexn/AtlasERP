import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/tenant.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTenantDto, userId: string): Promise<{
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
        rc: string | null;
        rib: string | null;
        website: string | null;
    }>;
    findByUserId(userId: string): Promise<{
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
        rc: string | null;
        rib: string | null;
        website: string | null;
    }>;
    updateCompany(userId: string, dto: any): Promise<{
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
        rc: string | null;
        rib: string | null;
        website: string | null;
    }>;
}
