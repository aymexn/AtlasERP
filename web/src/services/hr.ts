import { apiFetch } from '@/lib/api';

export interface Employee {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    department?: string | null;
    status: string;
    hireDate: string;
    contracts?: any[];
    user?: any;
    manager?: any;
}

export const hrService = {
    // Employees
    async listEmployees(filters: any = {}) {
        const query = new URLSearchParams(filters).toString();
        return apiFetch(`/hr/employees?${query}`);
    },

    async getEmployee(id: string) {
        return apiFetch(`/hr/employees/${id}`);
    },

    async createEmployee(data: any) {
        return apiFetch('/hr/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateEmployee(id: string, data: any) {
        return apiFetch(`/hr/employees/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async addContract(employeeId: string, data: any) {
        return apiFetch(`/hr/employees/${employeeId}/contracts`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Leaves
    async listLeaveTypes() {
        return apiFetch('/hr/leaves/types');
    },

    async listLeaveRequests(filters: any = {}) {
        const query = new URLSearchParams(filters).toString();
        return apiFetch(`/hr/leaves/requests?${query}`);
    },

    async requestLeave(data: any) {
        return apiFetch('/hr/leaves/requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async approveLeave(id: string, stage: 'manager' | 'hr', comment?: string) {
        const endpoint = stage === 'manager' ? 'approve-manager' : 'approve-hr';
        return apiFetch(`/hr/leaves/requests/${id}/${endpoint}`, {
            method: 'PATCH',
            body: JSON.stringify({ comment }),
        });
    },

    async rejectLeave(id: string, comment?: string) {
        return apiFetch(`/hr/leaves/requests/${id}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ comment }),
        });
    },

    // Payroll
    async listPayrollPeriods() {
        return apiFetch('/hr/payroll/periods');
    },

    async createPayrollPeriod(data: any) {
        return apiFetch('/hr/payroll/periods', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async calculatePayroll(periodId: string) {
        return apiFetch(`/hr/payroll/periods/${periodId}/calculate`, {
            method: 'POST',
        });
    },

    async getPayrollRuns(periodId: string) {
        return apiFetch(`/hr/payroll/periods/${periodId}/runs`);
    },

    // Recruitment
    async listJobs() {
        return apiFetch('/hr/recruitment/jobs');
    },

    async createJob(data: any) {
        return apiFetch('/hr/recruitment/jobs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async listApplications(jobId?: string) {
        const query = jobId ? `?jobId=${jobId}` : '';
        return apiFetch(`/hr/recruitment/applications${query}`);
    },

    async updateApplicationStage(id: string, stage: string) {
        return apiFetch(`/hr/recruitment/applications/${id}/stage`, {
            method: 'PATCH',
            body: JSON.stringify({ stage }),
        });
    },

    async hireCandidate(applicationId: string) {
        return apiFetch(`/hr/recruitment/applications/${applicationId}/hire`, {
            method: 'POST',
        });
    },

    // Performance
    async listAppraisalCycles() {
        return apiFetch('/hr/performance/cycles');
    },

    async createAppraisalCycle(data: any) {
        return apiFetch('/hr/performance/cycles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getReviews(cycleId: string) {
        return apiFetch(`/hr/performance/cycles/${cycleId}/reviews`);
    },
};
