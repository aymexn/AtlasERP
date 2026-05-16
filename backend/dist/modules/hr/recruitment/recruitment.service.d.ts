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
    createJobPosting(companyId: string, data: any, userId: string): Promise<{
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
    getCandidates(companyId: string): Promise<({
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
    createCandidate(companyId: string, data: any): Promise<{
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
    applyToJob(jobPostingId: string, candidateId: string, notes?: string): Promise<{
        id: string;
        notes: string | null;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        jobPostingId: string;
        candidateId: string;
    }>;
    getApplications(companyId: string, jobPostingId?: string): Promise<({
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
    updateApplicationStage(applicationId: string, stage: ApplicationStage): Promise<{
        id: string;
        notes: string | null;
        applicationDate: Date;
        stage: import(".prisma/client").$Enums.ApplicationStage;
        jobPostingId: string;
        candidateId: string;
    }>;
    scheduleInterview(applicationId: string, data: any): Promise<{
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
    hireCandidate(companyId: string, applicationId: string): Promise<{
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
}
