import { FamiliesService } from './families.service';
import { CreateFamilyDto, UpdateFamilyDto } from './dto/family.dto';
export declare class FamiliesController {
    private readonly familiesService;
    constructor(familiesService: FamiliesService);
    create(createFamilyDto: CreateFamilyDto, req: any): Promise<{
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
    findAll(req: any): Promise<({
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
    remove(id: string, req: any): Promise<{
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
    update(id: string, dto: UpdateFamilyDto, req: any): Promise<{
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
}
