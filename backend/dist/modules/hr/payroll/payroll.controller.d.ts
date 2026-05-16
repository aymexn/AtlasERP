import { PayrollService } from './payroll.service';
import { PdfService } from '../../../common/services/pdf.service';
import { Response } from 'express';
export declare class PayrollController {
    private readonly payrollService;
    private readonly pdfService;
    constructor(payrollService: PayrollService, pdfService: PdfService);
    getPeriods(req: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PayrollStatus;
        companyId: string;
        createdAt: Date;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date;
        locked: boolean;
    }[]>;
    createPeriod(req: any, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PayrollStatus;
        companyId: string;
        createdAt: Date;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date;
        locked: boolean;
    }>;
    calculatePayroll(req: any, id: string): Promise<any[]>;
    getPayrollRuns(id: string): Promise<({
        employee: {
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
        };
    } & {
        id: string;
        status: string | null;
        createdAt: Date;
        employeeId: string;
        payrollPeriodId: string;
        grossSalary: import("@prisma/client/runtime/library").Decimal | null;
        totalEarnings: import("@prisma/client/runtime/library").Decimal | null;
        totalDeductions: import("@prisma/client/runtime/library").Decimal | null;
        netSalary: import("@prisma/client/runtime/library").Decimal | null;
        employerCost: import("@prisma/client/runtime/library").Decimal | null;
        calculationDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    streamPayslip(id: string, res: Response): Promise<void>;
    generatePayslip(id: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        employeeId: string;
        filePath: string | null;
        payrollRunId: string;
        generatedAt: Date;
    }>;
    getEmployeePayslips(id: string): Promise<{
        id: string;
        periodStart: Date;
        periodEnd: Date;
        employeeId: string;
        filePath: string | null;
        payrollRunId: string;
        generatedAt: Date;
    }[]>;
}
