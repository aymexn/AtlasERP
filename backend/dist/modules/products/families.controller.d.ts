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
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        code: string | null;
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
    remove(id: string, req: any): Promise<{
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
        isActive: boolean;
        description: string | null;
        updatedAt: Date;
        code: string | null;
        colorBadge: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
}
