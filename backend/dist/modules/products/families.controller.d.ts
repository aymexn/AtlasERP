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
    findAll(req: any): Promise<({
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
    remove(id: string, req: any): Promise<{
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
    update(id: string, dto: UpdateFamilyDto, req: any): Promise<{
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
}
