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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        name: string;
        isActive: boolean;
        code: string | null;
        description: string | null;
        sortOrder: number;
        colorBadge: string | null;
        parentId: string | null;
    })[]>;
    create(companyId: string, dto: CreateFamilyDto): Promise<{
        parent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        name: string;
        isActive: boolean;
        code: string | null;
        description: string | null;
        sortOrder: number;
        colorBadge: string | null;
        parentId: string | null;
    }>;
    update(id: string, companyId: string, dto: UpdateFamilyDto): Promise<{
        parent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        name: string;
        isActive: boolean;
        code: string | null;
        description: string | null;
        sortOrder: number;
        colorBadge: string | null;
        parentId: string | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        name: string;
        isActive: boolean;
        code: string | null;
        description: string | null;
        sortOrder: number;
        colorBadge: string | null;
        parentId: string | null;
    }>;
}
