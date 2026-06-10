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
    findAll(req: any): Promise<({
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
    remove(id: string, req: any): Promise<{
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
    update(id: string, dto: UpdateFamilyDto, req: any): Promise<{
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
}
