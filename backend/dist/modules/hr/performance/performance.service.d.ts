import { PrismaService } from '../../prisma/prisma.service';
export declare class PerformanceService {
    private prisma;
    constructor(prisma: PrismaService);
    getCycles(companyId: string): Promise<({
        _count: {
            reviews: number;
        };
    } & {
        id: string;
        companyId: string;
        name: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AppraisalStatus;
        createdAt: Date;
    })[]>;
    createCycle(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        name: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AppraisalStatus;
        createdAt: Date;
    }>;
    initializeReviews(cycleId: string): Promise<any[]>;
    getReviews(cycleId: string): Promise<({
        employee: {
            id: string;
            companyId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            createdAt: Date;
            userId: string | null;
            employeeCode: string | null;
            firstName: string;
            lastName: string;
            birthDate: Date | null;
            birthPlace: string | null;
            nationality: string | null;
            gender: string | null;
            maritalStatus: string | null;
            address: string | null;
            phone: string | null;
            email: string | null;
            socialSecurityNumber: string | null;
            taxId: string | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            emergencyContactRelationship: string | null;
            bankAccountIban: string | null;
            bankName: string | null;
            hireDate: Date;
            terminationDate: Date | null;
            department: string | null;
            position: string | null;
            managerId: string | null;
            notes: string | null;
            updatedAt: Date;
        };
        reviewer: {
            id: string;
            companyId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            createdAt: Date;
            userId: string | null;
            employeeCode: string | null;
            firstName: string;
            lastName: string;
            birthDate: Date | null;
            birthPlace: string | null;
            nationality: string | null;
            gender: string | null;
            maritalStatus: string | null;
            address: string | null;
            phone: string | null;
            email: string | null;
            socialSecurityNumber: string | null;
            taxId: string | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            emergencyContactRelationship: string | null;
            bankAccountIban: string | null;
            bankName: string | null;
            hireDate: Date;
            terminationDate: Date | null;
            department: string | null;
            position: string | null;
            managerId: string | null;
            notes: string | null;
            updatedAt: Date;
        };
        objectives: {
            id: string;
            createdAt: Date;
            reviewId: string;
            description: string;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            target: string | null;
            achievementPercent: import("@prisma/client/runtime/library").Decimal | null;
            employeeComment: string | null;
            managerComment: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
        cycleId: string;
        employeeId: string;
        reviewerId: string;
        selfReview: import("@prisma/client/runtime/library").JsonValue | null;
        managerReview: import("@prisma/client/runtime/library").JsonValue | null;
        finalRating: number | null;
    })[]>;
    updateSelfReview(reviewId: string, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
        cycleId: string;
        employeeId: string;
        reviewerId: string;
        selfReview: import("@prisma/client/runtime/library").JsonValue | null;
        managerReview: import("@prisma/client/runtime/library").JsonValue | null;
        finalRating: number | null;
    }>;
    updateManagerReview(reviewId: string, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
        cycleId: string;
        employeeId: string;
        reviewerId: string;
        selfReview: import("@prisma/client/runtime/library").JsonValue | null;
        managerReview: import("@prisma/client/runtime/library").JsonValue | null;
        finalRating: number | null;
    }>;
    createObjective(reviewId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        reviewId: string;
        description: string;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        target: string | null;
        achievementPercent: import("@prisma/client/runtime/library").Decimal | null;
        employeeComment: string | null;
        managerComment: string | null;
    }>;
    getEmployeeHistory(employeeId: string): Promise<({
        cycle: {
            id: string;
            companyId: string;
            name: string | null;
            startDate: Date | null;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.AppraisalStatus;
            createdAt: Date;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
        cycleId: string;
        employeeId: string;
        reviewerId: string;
        selfReview: import("@prisma/client/runtime/library").JsonValue | null;
        managerReview: import("@prisma/client/runtime/library").JsonValue | null;
        finalRating: number | null;
    })[]>;
}
