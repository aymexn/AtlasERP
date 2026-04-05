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
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        sortOrder: number;
        parentId: string | null;
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
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        sortOrder: number;
        parentId: string | null;
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
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        sortOrder: number;
        parentId: string | null;
    }>;
}
