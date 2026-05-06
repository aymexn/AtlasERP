import { PayrollService } from './payroll.service';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    getPeriods(req: any): Promise<{
        id: string;
        companyId: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date;
        status: import(".prisma/client").$Enums.PayrollStatus;
        locked: boolean;
        createdAt: Date;
    }[]>;
    createPeriod(req: any, data: any): Promise<{
        id: string;
        companyId: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date;
        status: import(".prisma/client").$Enums.PayrollStatus;
        locked: boolean;
        createdAt: Date;
    }>;
    calculatePayroll(req: any, id: string): Promise<any[]>;
    getPayrollRuns(id: string): Promise<({
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
    } & {
        id: string;
        status: string | null;
        createdAt: Date;
        payrollPeriodId: string;
        employeeId: string;
        grossSalary: import("@prisma/client/runtime/library").Decimal | null;
        totalEarnings: import("@prisma/client/runtime/library").Decimal | null;
        totalDeductions: import("@prisma/client/runtime/library").Decimal | null;
        netSalary: import("@prisma/client/runtime/library").Decimal | null;
        employerCost: import("@prisma/client/runtime/library").Decimal | null;
        calculationDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    generatePayslip(id: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        employeeId: string;
        payrollRunId: string;
        filePath: string | null;
        generatedAt: Date;
    }>;
    getEmployeePayslips(id: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        employeeId: string;
        payrollRunId: string;
        filePath: string | null;
        generatedAt: Date;
    }[]>;
}
