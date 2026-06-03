import { RecruitmentService } from './recruitment.service';
import { ApplicationStage } from '@prisma/client';
export declare class RecruitmentController {
    private readonly recruitmentService;
    constructor(recruitmentService: RecruitmentService);
    getJobPostings(req: any): Promise<({
        _count: {
            applications: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.JobStatus;
        companyId: string;
        createdAt: Date;
        description: string | null;
        title: string;
        location: string | null;
        department: string | null;
        requirements: string | null;
        employmentType: string | null;
        postedBy: string | null;
        closedAt: Date | null;
    })[]>;
    createJobPosting(req: any, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.JobStatus;
        companyId: string;
        createdAt: Date;
        description: string | null;
        title: string;
        location: string | null;
        department: string | null;
        requirements: string | null;
        employmentType: string | null;
        postedBy: string | null;
        closedAt: Date | null;
    }>;
    getCandidates(req: any): Promise<({
        applications: ({
            jobPosting: {
                id: string;
                status: import(".prisma/client").$Enums.JobStatus;
                companyId: string;
                createdAt: Date;
                description: string | null;
                title: string;
                location: string | null;
                department: string | null;
                requirements: string | null;
                employmentType: string | null;
                postedBy: string | null;
                closedAt: Date | null;
            };
        } & {
            id: string;
            notes: string | null;
            applicationDate: Date;
            stage: import(".prisma/client").$Enums.ApplicationStage;
            jobPostingId: string;
            candidateId: string;
        })[];
    } & {
        id: string;
        email: string | null;
        status: import(".prisma/client").$Enums.CandidateStatus;
        companyId: string;
        createdAt: Date;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        cvPath: string | null;
        coverLetterPath: string | null;
        source: string | null;
    })[]>;
    createCandidate(req: any, data: any): Promise<{
        id: string;
        email: string | null;
        status: import(".prisma/client").$Enums.CandidateStatus;
        companyId: string;
        createdAt: Date;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        cvPath: string | null;
        coverLetterPath: string | null;
        source: string | null;
    }>;
    getApplications(req: any, jobId?: string): Promise<({
        jobPosting: {
            id: string;
            status: import(".prisma/client").$Enums.JobStatus;
            companyId: string;
            createdAt: Date;
            description: string | null;
            title: string;
            location: string | null;
            department: string | null;
            requirements: string | null;
            employmentType: string | null;
            postedBy: string | null;
            closedAt: Date | null;
        };
        candidate: {
            id: string;
            email: string | null;
            status: import(".prisma/client").$Enums.CandidateStatus;
            companyId: string;
            createdAt: Date;
            phone: string | null;
            firstName: string | null;
            lastName: string | null;
            cvPath: string | null;
            coverLetterPath: string | null;
            source: string | null;
        };
        interviews: {
            id: string;
            createdAt: Date;
            result: import(".prisma/client").$Enums.InterviewResult;
            scheduledAt: Date | null;
            durationMinutes: number | null;
            interviewType: import(".prisma/client").$Enums.InterviewType | null;
            locationOrLink: string | null;
            interviewerIds: string[];
            feedback: string | null;
            rating: number | null;
            applicationId: string;
        }[];
        offers: {
            message: string | null;
            id: string;
            status: import(".prisma/client").$Enums.OfferStatus;
            createdAt: Date;
            startDate: Date | null;
            applicationId: string;
            salaryOffered: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    } & {
        id: string;
        notes: string | null;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        jobPostingId: string;
        candidateId: string;
    })[]>;
    updateApplicationStage(id: string, stage: ApplicationStage): Promise<{
        id: string;
        notes: string | null;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        jobPostingId: string;
        candidateId: string;
    }>;
    hireCandidate(req: any, id: string): Promise<{
        id: string;
        email: string | null;
        status: import(".prisma/client").$Enums.EmployeeStatus;
        companyId: string;
        createdAt: Date;
        userId: string | null;
        address: string | null;
        phone: string | null;
        updatedAt: Date;
        taxId: string | null;
        notes: string | null;
        employeeCode: string | null;
        firstName: string;
        lastName: string;
        birthDate: Date | null;
        birthPlace: string | null;
        nationality: string | null;
        gender: string | null;
        maritalStatus: string | null;
        socialSecurityNumber: string | null;
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
    }>;
    applyToJob(data: any): Promise<{
        id: string;
        notes: string | null;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        jobPostingId: string;
        candidateId: string;
    }>;
    scheduleInterview(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        result: import(".prisma/client").$Enums.InterviewResult;
        scheduledAt: Date | null;
        durationMinutes: number | null;
        interviewType: import(".prisma/client").$Enums.InterviewType | null;
        locationOrLink: string | null;
        interviewerIds: string[];
        feedback: string | null;
        rating: number | null;
        applicationId: string;
    }>;
}
