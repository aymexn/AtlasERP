import { apiFetch } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Employee {
    id: string;
    employeeCode?: string | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    department?: string | null;
    status: string;
    hireDate: string;
    baseSalary?: number | null;
    currency?: string | null;
    gender?: string | null;
    nationality?: string | null;
    address?: string | null;
    city?: string | null;
    socialSecurityNumber?: string | null;
    taxId?: string | null;
    bankName?: string | null;
    bankAccountIban?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    contracts?: Contract[];
    user?: any;
    manager?: any;
}

export interface Contract {
    id: string;
    contractType: string;
    startDate: string;
    endDate?: string | null;
    salaryBaseAmount?: number | null;
    workingHoursPerWeek?: number | null;
    isActive: boolean;
}

export interface LeaveType {
    id: string;
    name: string;
    code: string;
    color?: string | null;
    isPaid: boolean;
    accrualRate?: number | null;
    maxDaysPerYear?: number | null;
    requiresApproval?: boolean;
}

export interface LeaveRequest {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string | null;
    employee?: Pick<Employee, 'id' | 'firstName' | 'lastName'>;
    leaveType?: Pick<LeaveType, 'id' | 'name' | 'color'>;
    appliedAt?: string;
}

export interface LeaveBalance {
    id: string;
    leaveType: LeaveType;
    periodYear: number;
    totalEntitled: number;
    usedDays: number;
    pendingDays: number;
    availableDays?: number;
}

export interface PayrollPeriod {
    id: string;
    periodName?: string | null;
    periodStart: string;
    periodEnd: string;
    paymentDate?: string | null;
    status: string;
    locked?: boolean;
}

export interface PayrollRun {
    id: string;
    employeeId: string;
    grossSalary?: number | null;
    totalDeductions?: number | null;
    netSalary?: number | null;
    employerCost?: number | null;
    status?: string | null;
    employee?: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'employeeCode' | 'position'>;
    calculationDetails?: any;
}

export interface JobPosting {
    id: string;
    title: string;
    department?: string | null;
    location?: string | null;
    employmentType?: string | null;
    description?: string | null;
    status: string;
    _count?: { applications: number };
}

export interface JobApplication {
    id: string;
    stage: string;
    applicationDate?: string | null;
    candidate?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
        phone?: string | null;
    };
    jobPosting?: Pick<JobPosting, 'id' | 'title' | 'department'>;
}

export interface AppraisalCycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    description?: string | null;
    _count?: { reviews: number };
}

export interface PerformanceReview {
    id: string;
    status: string;
    finalRating?: number | null;
    reviewType?: string | null;
    selfReview?: any;
    managerReview?: any;
    employee?: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'position'>;
    reviewer?: Pick<Employee, 'id' | 'firstName' | 'lastName'>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const hrService = {

    // ── Employees ──────────────────────────────────────────────────────────

    async listEmployees(filters: Record<string, string> = {}): Promise<Employee[]> {
        const query = new URLSearchParams(filters).toString();
        return apiFetch(`/hr/employees${query ? `?${query}` : ''}`);
    },

    async getEmployee(id: string): Promise<Employee> {
        return apiFetch(`/hr/employees/${id}`);
    },

    async createEmployee(data: any): Promise<Employee> {
        return apiFetch('/hr/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateEmployee(id: string, data: any): Promise<Employee> {
        return apiFetch(`/hr/employees/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async addContract(employeeId: string, data: any): Promise<Contract> {
        return apiFetch(`/hr/employees/${employeeId}/contracts`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ── Leaves ─────────────────────────────────────────────────────────────

    async listLeaveTypes(): Promise<LeaveType[]> {
        return apiFetch('/hr/leaves/types');
    },

    async createLeaveType(data: any): Promise<LeaveType> {
        return apiFetch('/hr/leaves/types', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async listLeaveRequests(filters: Record<string, string> = {}): Promise<LeaveRequest[]> {
        const query = new URLSearchParams(filters).toString();
        return apiFetch(`/hr/leaves/requests${query ? `?${query}` : ''}`);
    },

    async requestLeave(data: {
        leaveTypeId: string;
        startDate: string;
        endDate: string;
        reason?: string;
        handoverNotes?: string;
        employeeId?: string;
    }): Promise<LeaveRequest> {
        return apiFetch('/hr/leaves/requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async approveLeave(id: string, stage: 'manager' | 'hr', comment?: string): Promise<LeaveRequest> {
        const endpoint = stage === 'manager' ? 'approve-manager' : 'approve-hr';
        return apiFetch(`/hr/leaves/requests/${id}/${endpoint}`, {
            method: 'PATCH',
            body: JSON.stringify({ comment }),
        });
    },

    async rejectLeave(id: string, comment?: string): Promise<LeaveRequest> {
        return apiFetch(`/hr/leaves/requests/${id}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ comment }),
        });
    },

    async getLeaveBalance(employeeId: string, year?: number): Promise<LeaveBalance[]> {
        const query = year ? `?year=${year}` : '';
        return apiFetch(`/hr/leaves/balance/${employeeId}${query}`);
    },

    async getLeaveCalendar(start: string, end: string): Promise<any[]> {
        return apiFetch(`/hr/leaves/calendar?start=${start}&end=${end}`);
    },

    // ── Payroll ────────────────────────────────────────────────────────────

    async listPayrollPeriods(): Promise<PayrollPeriod[]> {
        return apiFetch('/hr/payroll/periods');
    },

    async createPayrollPeriod(data: {
        periodStart: string;
        periodEnd: string;
        paymentDate: string;
        periodName?: string;
    }): Promise<PayrollPeriod> {
        return apiFetch('/hr/payroll/periods', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async calculatePayroll(periodId: string): Promise<PayrollRun[]> {
        return apiFetch(`/hr/payroll/periods/${periodId}/calculate`, {
            method: 'POST',
        });
    },

    async getPayrollRuns(periodId: string): Promise<PayrollRun[]> {
        return apiFetch(`/hr/payroll/periods/${periodId}/runs`);
    },

    async generatePayslip(runId: string): Promise<any> {
        return apiFetch(`/hr/payroll/runs/${runId}/payslip`, {
            method: 'POST',
        });
    },

    async downloadPayslip(runId: string, filename: string): Promise<boolean> {
        const { downloadPdf } = await import('@/lib/download-pdf');
        return downloadPdf(`/hr/payroll/runs/${runId}/pdf`, filename);
    },

    async getEmployeePayslips(employeeId: string): Promise<any[]> {
        return apiFetch(`/hr/payroll/employees/${employeeId}/payslips`);
    },

    // ── Recruitment ────────────────────────────────────────────────────────

    async listJobs(): Promise<JobPosting[]> {
        return apiFetch('/hr/recruitment/jobs');
    },

    async createJob(data: {
        title: string;
        department?: string;
        location?: string;
        employmentType?: string;
        description: string;
    }): Promise<JobPosting> {
        return apiFetch('/hr/recruitment/jobs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async listCandidates(): Promise<any[]> {
        return apiFetch('/hr/recruitment/candidates');
    },

    async createCandidate(data: any): Promise<any> {
        return apiFetch('/hr/recruitment/candidates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async listApplications(jobId?: string): Promise<JobApplication[]> {
        const query = jobId ? `?jobId=${jobId}` : '';
        return apiFetch(`/hr/recruitment/applications${query}`);
    },

    async applyToJob(jobPostingId: string, candidateId: string, notes?: string): Promise<JobApplication> {
        return apiFetch('/hr/recruitment/applications', {
            method: 'POST',
            body: JSON.stringify({ jobPostingId, candidateId, notes }),
        });
    },

    async updateApplicationStage(id: string, stage: string): Promise<JobApplication> {
        return apiFetch(`/hr/recruitment/applications/${id}/stage`, {
            method: 'PATCH',
            body: JSON.stringify({ stage }),
        });
    },

    async hireCandidate(applicationId: string): Promise<Employee> {
        return apiFetch(`/hr/recruitment/applications/${applicationId}/hire`, {
            method: 'POST',
        });
    },

    async scheduleInterview(applicationId: string, data: any): Promise<any> {
        return apiFetch(`/hr/recruitment/applications/${applicationId}/interviews`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ── Performance ────────────────────────────────────────────────────────

    async listAppraisalCycles(): Promise<AppraisalCycle[]> {
        return apiFetch('/hr/performance/cycles');
    },

    async createAppraisalCycle(data: {
        name: string;
        startDate: string;
        endDate: string;
        description?: string;
    }): Promise<AppraisalCycle> {
        return apiFetch('/hr/performance/cycles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async initializeCycleReviews(cycleId: string): Promise<PerformanceReview[]> {
        return apiFetch(`/hr/performance/cycles/${cycleId}/initialize`, {
            method: 'POST',
        });
    },

    async getReviews(cycleId: string): Promise<PerformanceReview[]> {
        return apiFetch(`/hr/performance/cycles/${cycleId}/reviews`);
    },

    async updateSelfReview(reviewId: string, data: any): Promise<PerformanceReview> {
        return apiFetch(`/hr/performance/reviews/${reviewId}/self`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async updateManagerReview(reviewId: string, data: {
        managerReview: any;
        finalRating: number;
    }): Promise<PerformanceReview> {
        return apiFetch(`/hr/performance/reviews/${reviewId}/manager`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getEmployeePerformanceHistory(employeeId: string): Promise<PerformanceReview[]> {
        return apiFetch(`/hr/performance/employees/${employeeId}/history`);
    },
};
