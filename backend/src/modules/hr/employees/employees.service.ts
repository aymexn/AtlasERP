import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeStatus, ContractType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface EmployeeFilters {
  status?: EmployeeStatus;
  department?: String;
  search?: string;
}

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  async findAll(companyId: string, filters: EmployeeFilters = {}) {
    const where: any = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.department) where.department = filters.department;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        contracts: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        contracts: {
          orderBy: { startDate: 'desc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
        manager: true,
        subordinates: true,
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(companyId: string, data: any) {
    const { contract, employmentType, baseSalary, currency, salaryType, city, ...employeeData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Employee
      const address = employeeData.address && city ? `${employeeData.address}, ${city}` : (employeeData.address || city || null);
      const employee = await tx.employee.create({
        data: {
          ...employeeData,
          address,
          companyId,
          hireDate: new Date(employeeData.hireDate),
          birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
        },
      });

      // 2. Create Initial Contract if provided
      if (contract) {
        const { probationMonths, ...contractData } = contract;
        let trialPeriodEnd = contractData.trialPeriodEnd ? new Date(contractData.trialPeriodEnd) : null;
        if (!trialPeriodEnd && probationMonths) {
          const start = new Date(contractData.startDate);
          start.setMonth(start.getMonth() + parseInt(probationMonths));
          trialPeriodEnd = start;
        }

        await tx.contract.create({
          data: {
            ...contractData,
            employeeId: employee.id,
            startDate: new Date(contractData.startDate),
            endDate: contractData.endDate ? new Date(contractData.endDate) : null,
            trialPeriodEnd,
            isActive: true,
          },
        });
      }

      return employee;
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async update(companyId: string, id: string, data: any) {
    const employee = await this.findOne(companyId, id);
    const { contract, employmentType, baseSalary, currency, salaryType, city, ...employeeData } = data;
    
    const address = employeeData.address !== undefined || city !== undefined
      ? (employeeData.address && city ? `${employeeData.address}, ${city}` : (employeeData.address || city || null))
      : undefined;

    const result = await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        ...employeeData,
        ...(address !== undefined ? { address } : {}),
        hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : undefined,
        birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : undefined,
        terminationDate: employeeData.terminationDate ? new Date(employeeData.terminationDate) : undefined,
      },
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async addContract(companyId: string, employeeId: string, data: any) {
    const employee = await this.findOne(companyId, employeeId);

    return this.prisma.$transaction(async (tx) => {
      // Deactivate current active contracts
      await tx.contract.updateMany({
        where: { employeeId: employee.id, isActive: true },
        data: { isActive: false },
      });

      // Create new contract
      return tx.contract.create({
        data: {
          ...data,
          employeeId: employee.id,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          trialPeriodEnd: data.trialPeriodEnd ? new Date(data.trialPeriodEnd) : null,
          isActive: true,
        },
      });
    });
  }

  async addDocument(companyId: string, employeeId: string, fileData: any, uploadedBy: string) {
    const employee = await this.findOne(companyId, employeeId);

    return this.prisma.hrDocument.create({
      data: {
        companyId,
        entityType: 'employee',
        entityId: employee.id,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        mimeType: fileData.mimeType,
        uploadedBy,
      },
    });
  }

  async removeDocument(companyId: string, documentId: string) {
    const doc = await this.prisma.hrDocument.findFirst({
      where: { id: documentId, companyId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.hrDocument.delete({
      where: { id: documentId },
    });
  }

  async remove(companyId: string, id: string) {
    const employee = await this.findOne(companyId, id);

    // Check if there are any payslips
    const payslipsCount = await this.prisma.payslip.count({
      where: { employeeId: employee.id }
    });
    if (payslipsCount > 0) {
      throw new ConflictException('Impossible de supprimer cet employé car des bulletins de paie y sont associés.');
    }

    // Check if there are any payroll runs
    const payrollRunsCount = await this.prisma.payrollRun.count({
      where: { employeeId: employee.id }
    });
    if (payrollRunsCount > 0) {
      throw new ConflictException('Impossible de supprimer cet employé car des calculs de paie y sont associés.');
    }

    // Check if there are any leave requests
    const leaveRequestsCount = await this.prisma.leaveRequest.count({
      where: { employeeId: employee.id }
    });
    if (leaveRequestsCount > 0) {
      throw new ConflictException('Impossible de supprimer cet employé car des demandes de congé y sont associées.');
    }

    // Delete the employee
    const result = await this.prisma.employee.delete({
      where: { id: employee.id }
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }
}
