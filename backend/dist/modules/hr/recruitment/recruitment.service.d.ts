import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStage } from '@prisma/client';
export declare class RecruitmentService {
    private prisma;
    constructor(prisma: PrismaService);
    getJobPostings(companyId: string): Promise<({
        _count: {
            applications: number;
        };
    } & {
        id: string;
        companyId: string;
        title: string;
        department: string | null;
        description: string | null;
        requirements: string | null;
        location: string | null;
        employmentType: string | null;
        status: import(".prisma/client").$Enums.JobStatus;
        postedBy: string | null;
        createdAt: Date;
        closedAt: Date | null;
    })[]>;
    createJobPosting(companyId: string, data: any, userId: string): Promise<{
        id: string;
        companyId: string;
        title: string;
        department: string | null;
        description: string | null;
        requirements: string | null;
        location: string | null;
        employmentType: string | null;
        status: import(".prisma/client").$Enums.JobStatus;
        postedBy: string | null;
        createdAt: Date;
        closedAt: Date | null;
    }>;
    getCandidates(companyId: string): Promise<({
        applications: ({
            jobPosting: {
                id: string;
                companyId: string;
                title: string;
                department: string | null;
                description: string | null;
                requirements: string | null;
                location: string | null;
                employmentType: string | null;
                status: import(".prisma/client").$Enums.JobStatus;
                postedBy: string | null;
                createdAt: Date;
                closedAt: Date | null;
            };
        } & {
            id: string;
            jobPostingId: string;
            candidateId: string;
            applicationDate: Date;
            stage: import(".prisma/client").$Enums.ApplicationStage;
            notes: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        status: import(".prisma/client").$Enums.CandidateStatus;
        createdAt: Date;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        cvPath: string | null;
        coverLetterPath: string | null;
        source: string | null;
    })[]>;
    createCandidate(companyId: string, data: any): Promise<{
        id: string;
        companyId: string;
        status: import(".prisma/client").$Enums.CandidateStatus;
        createdAt: Date;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        cvPath: string | null;
        coverLetterPath: string | null;
        source: string | null;
    }>;
    applyToJob(jobPostingId: string, candidateId: string, notes?: string): Promise<{
        id: string;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        notes: string | null;
    }>;
    getApplications(companyId: string, jobPostingId?: string): Promise<({
        jobPosting: {
            id: string;
            companyId: string;
            title: string;
            department: string | null;
            description: string | null;
            requirements: string | null;
            location: string | null;
            employmentType: string | null;
            status: import(".prisma/client").$Enums.JobStatus;
            postedBy: string | null;
            createdAt: Date;
            closedAt: Date | null;
        };
        candidate: {
            id: string;
            companyId: string;
            status: import(".prisma/client").$Enums.CandidateStatus;
            createdAt: Date;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
            phone: string | null;
            cvPath: string | null;
            coverLetterPath: string | null;
            source: string | null;
        };
        interviews: {
            result: import(".prisma/client").$Enums.InterviewResult;
            id: string;
            createdAt: Date;
            applicationId: string;
            scheduledAt: Date | null;
            durationMinutes: number | null;
            interviewType: import(".prisma/client").$Enums.InterviewType | null;
            locationOrLink: string | null;
            interviewerIds: string[];
            feedback: string | null;
            rating: number | null;
        }[];
        offers: {
            id: string;
            status: import(".prisma/client").$Enums.OfferStatus;
            createdAt: Date;
            applicationId: string;
            salaryOffered: import("@prisma/client/runtime/library").Decimal | null;
            startDate: Date | null;
            message: string | null;
        }[];
    } & {
        id: string;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        notes: string | null;
    })[]>;
    updateApplicationStage(applicationId: string, stage: ApplicationStage): Promise<{
        id: string;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        notes: string | null;
    }>;
    scheduleInterview(applicationId: string, data: any): Promise<{
        result: import(".prisma/client").$Enums.InterviewResult;
        id: string;
        createdAt: Date;
        applicationId: string;
        scheduledAt: Date | null;
        durationMinutes: number | null;
        interviewType: import(".prisma/client").$Enums.InterviewType | null;
        locationOrLink: string | null;
        interviewerIds: string[];
        feedback: string | null;
        rating: number | null;
    }>;
    hireCandidate(companyId: string, applicationId: string): Promise<{
        id: string;
        companyId: string;
        department: string | null;
        status: import(".prisma/client").$Enums.EmployeeStatus;
        createdAt: Date;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        notes: string | null;
        employeeCode: string | null;
        birthDate: Date | null;
        birthPlace: string | null;
        nationality: string | null;
        gender: string | null;
        maritalStatus: string | null;
        address: string | null;
        socialSecurityNumber: string | null;
        taxId: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelationship: string | null;
        bankAccountIban: string | null;
        bankName: string | null;
        hireDate: Date;
        terminationDate: Date | null;
        position: string | null;
        updatedAt: Date;
        userId: string | null;
        managerId: string | null;
    }>;
}
