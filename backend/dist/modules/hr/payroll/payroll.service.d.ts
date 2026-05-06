import { PrismaService } from '../../prisma/prisma.service';
export declare class PayrollService {
    private prisma;
    constructor(prisma: PrismaService);
    createPeriod(companyId: string, data: any): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date;
        status: import(".prisma/client").$Enums.PayrollStatus;
        locked: boolean;
        createdAt: Date;
        companyId: string;
    }>;
    calculatePayroll(companyId: string, periodId: string): Promise<any[]>;
    private calculateIRG;
    getPeriods(companyId: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date;
        status: import(".prisma/client").$Enums.PayrollStatus;
        locked: boolean;
        createdAt: Date;
        companyId: string;
    }[]>;
    getPayrollRuns(periodId: string): Promise<({
        employee: {
            id: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            createdAt: Date;
            companyId: string;
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
    getPayslips(employeeId: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        employeeId: string;
        payrollRunId: string;
        filePath: string | null;
        generatedAt: Date;
    }[]>;
    generatePayslip(runId: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        employeeId: string;
        payrollRunId: string;
        filePath: string | null;
        generatedAt: Date;
    }>;
}
