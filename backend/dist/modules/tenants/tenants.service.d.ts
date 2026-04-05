import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/tenant.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTenantDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }>;
    findByUserId(userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }>;
}
