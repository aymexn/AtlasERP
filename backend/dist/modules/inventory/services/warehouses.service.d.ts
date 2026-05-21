import { PrismaService } from '../../prisma/prisma.service';
export declare class WarehousesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listWarehouses(companyId: string): Promise<{
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
