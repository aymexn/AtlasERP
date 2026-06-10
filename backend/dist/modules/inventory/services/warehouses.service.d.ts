import { PrismaService } from '../../prisma/prisma.service';
export declare class WarehousesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listWarehouses(companyId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        companyId: string;
        updatedAt: Date;
        location: string | null;
        code: string | null;
        isActive: boolean;
    }[]>;
}
