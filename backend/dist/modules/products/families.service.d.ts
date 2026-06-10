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
        name: string;
        companyId: string;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        isActive: boolean;
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
        createdAt: Date;
        name: string;
        companyId: string;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        isActive: boolean;
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
        createdAt: Date;
        name: string;
        companyId: string;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        isActive: boolean;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        companyId: string;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        isActive: boolean;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
}
