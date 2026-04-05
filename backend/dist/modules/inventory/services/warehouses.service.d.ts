import { PrismaService } from '../../prisma/prisma.service';
export declare class WarehousesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listWarehouses(companyId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        location: string | null;
    }[]>;
}
