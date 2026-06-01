import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStage } from '@prisma/client';
import { NotificationService } from '../../notifications/notifications.service';
export declare class RecruitmentService {
    private prisma;
    private notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getJobPostings(companyId: string): Promise<({
        _count: {
            applications: number;
        };
    } & {
        id: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        companyId: string;
        description: string | null;
        department: string | null;
        location: string | null;
        requirements: string | null;
        employmentType: string | null;
        postedBy: string | null;
        closedAt: Date | null;
    })[]>;
    createJobPosting(companyId: string, data: any, userId: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        companyId: string;
        description: string | null;
        department: string | null;
        location: string | null;
        requirements: string | null;
        employmentType: string | null;
        postedBy: string | null;
        closedAt: Date | null;
    }>;
    getCandidates(companyId: string): Promise<({
        applications: ({
            jobPosting: {
                id: string;
                title: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.JobStatus;
                companyId: string;
                description: string | null;
                department: string | null;
                location: string | null;
                requirements: string | null;
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
    createCandidate(companyId: string, data: any): Promise<{
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
    applyToJob(jobPostingId: string, candidateId: string, notes?: string): Promise<{
        id: string;
        notes: string | null;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
    }>;
    getApplications(companyId: string, jobPostingId?: string): Promise<({
        interviews: {
            id: string;
            createdAt: Date;
            result: import(".prisma/client").$Enums.InterviewResult;
            applicationId: string;
            scheduledAt: Date | null;
            durationMinutes: number | null;
            interviewType: import(".prisma/client").$Enums.InterviewType | null;
            locationOrLink: string | null;
            interviewerIds: string[];
            feedback: string | null;
            rating: number | null;
        }[];
        jobPosting: {
            id: string;
            title: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            companyId: string;
            description: string | null;
            department: string | null;
            location: string | null;
            requirements: string | null;
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
        offers: {
            id: string;
            message: string | null;
            createdAt: Date;
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
    updateApplicationStage(applicationId: string, stage: ApplicationStage): Promise<{
        id: string;
        notes: string | null;
        jobPostingId: string;
        candidateId: string;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
    }>;
    scheduleInterview(applicationId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        result: import(".prisma/client").$Enums.InterviewResult;
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
        createdAt: Date;
        userId: string | null;
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
        updatedAt: Date;
    }>;
}
