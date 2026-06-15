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
        description: string | null;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        companyId: string;
        department: string | null;
        title: string;
        requirements: string | null;
        location: string | null;
        employmentType: string | null;
        postedBy: string | null;
        closedAt: Date | null;
    })[]>;
    createJobPosting(req: any, data: any): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        companyId: string;
        department: string | null;
        title: string;
        requirements: string | null;
        location: string | null;
        employmentType: string | null;
        postedBy: string | null;
        closedAt: Date | null;
    }>;
    getCandidates(req: any): Promise<({
        applications: ({
            jobPosting: {
                id: string;
                description: string | null;
                createdAt: Date;
                status: import(".prisma/client").$Enums.JobStatus;
                companyId: string;
                department: string | null;
                title: string;
                requirements: string | null;
                location: string | null;
                employmentType: string | null;
                postedBy: string | null;
                closedAt: Date | null;
            };
        } & {
            id: string;
            notes: string | null;
            jobPostingId: string;
            candidateId: string;
            applicationDate: Date;
            stage: import(".prisma/client").$Enums.ApplicationStage;
        })[];
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        status: import(".prisma/client").$Enums.CandidateStatus;
        companyId: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        cvPath: string | null;
        coverLetterPath: string | null;
        source: string | null;
    })[]>;
    createCandidate(req: any, data: any): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        status: import(".prisma/client").$Enums.CandidateStatus;
        companyId: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        cvPath: string | null;
        coverLetterPath: string | null;
        source: string | null;
    }>;
    getApplications(req: any, jobId?: string): Promise<({
        jobPosting: {
            id: string;
            description: string | null;
            createdAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            companyId: string;
            department: string | null;
            title: string;
            requirements: string | null;
            location: string | null;
            employmentType: string | null;
            postedBy: string | null;
            closedAt: Date | null;
        };
        candidate: {
            id: string;
            createdAt: Date;
            email: string | null;
            status: import(".prisma/client").$Enums.CandidateStatus;
            companyId: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            cvPath: string | null;
            coverLetterPath: string | null;
            source: string | null;
        };
        interviews: {
            result: import(".prisma/client").$Enums.InterviewResult;
            id: string;
            createdAt: Date;
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
            id: string;
            createdAt: Date;
            message: string | null;
            status: import(".prisma/client").$Enums.OfferStatus;
            startDate: Date | null;
            applicationId: string;
            salaryOffered: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    } & {
        id: string;
        notes: string | null;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
    })[]>;
    updateApplicationStage(id: string, stage: ApplicationStage): Promise<{
        id: string;
        notes: string | null;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
    }>;
    hireCandidate(req: any, id: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        status: import(".prisma/client").$Enums.EmployeeStatus;
        companyId: string;
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
    }>;
    applyToJob(data: any): Promise<{
        id: string;
        notes: string | null;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
    }>;
    scheduleInterview(id: string, data: any): Promise<{
        result: import(".prisma/client").$Enums.InterviewResult;
        id: string;
        createdAt: Date;
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
