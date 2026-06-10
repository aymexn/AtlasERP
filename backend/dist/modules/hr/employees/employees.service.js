"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let EmployeesService = class EmployeesService {
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async findAll(companyId, filters = {}) {
        const where = { companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.department)
            where.department = filters.department;
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
    async findOne(companyId, id) {
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
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return employee;
    }
    async create(companyId, data) {
        const { contract, employmentType, baseSalary, currency, salaryType, city, ...employeeData } = data;
        const result = await this.prisma.$transaction(async (tx) => {
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
    async update(companyId, id, data) {
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
    async addContract(companyId, employeeId, data) {
        const employee = await this.findOne(companyId, employeeId);
        return this.prisma.$transaction(async (tx) => {
            await tx.contract.updateMany({
                where: { employeeId: employee.id, isActive: true },
                data: { isActive: false },
            });
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
    async addDocument(companyId, employeeId, fileData, uploadedBy) {
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
    async removeDocument(companyId, documentId) {
        const doc = await this.prisma.hrDocument.findFirst({
            where: { id: documentId, companyId },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        return this.prisma.hrDocument.delete({
            where: { id: documentId },
        });
    }
    async remove(companyId, id) {
        const employee = await this.findOne(companyId, id);
        const payslipsCount = await this.prisma.payslip.count({
            where: { employeeId: employee.id }
        });
        if (payslipsCount > 0) {
            throw new common_1.ConflictException('Impossible de supprimer cet employé car des bulletins de paie y sont associés.');
        }
        const payrollRunsCount = await this.prisma.payrollRun.count({
            where: { employeeId: employee.id }
        });
        if (payrollRunsCount > 0) {
            throw new common_1.ConflictException('Impossible de supprimer cet employé car des calculs de paie y sont associés.');
        }
        const leaveRequestsCount = await this.prisma.leaveRequest.count({
            where: { employeeId: employee.id }
        });
        if (leaveRequestsCount > 0) {
            throw new common_1.ConflictException('Impossible de supprimer cet employé car des demandes de congé y sont associées.');
        }
        const result = await this.prisma.employee.delete({
            where: { id: employee.id }
        });
        this.eventEmitter.emit('dashboard.refresh', { companyId });
        return result;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map