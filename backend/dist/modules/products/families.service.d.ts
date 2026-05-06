import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
export declare class FamiliesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        parent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    })[]>;
    create(companyId: string, dto: CreateFamilyDto): Promise<{
        parent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
    update(id: string, companyId: string, dto: UpdateFamilyDto): Promise<{
        parent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
}
