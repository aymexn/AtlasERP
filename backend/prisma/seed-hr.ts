import { PrismaClient, LeaveStatus, CandidateStatus, ApplicationStage, ReviewStatus, PayrollStatus, JobStatus, AppraisalStatus } from '@prisma/client';

const prisma = new PrismaClient();
const COMPANY_ID = 'ae144f97-26c9-4c6a-b1dc-e48834f18553'; // Atlas Peinture Tenant ID

async function main() {
  console.log('🚀 Seeding AtlasERP HR Module...');

  // 1. Leave Types
  console.log('📅 Creating Leave Types...');
  const annualLeave = await prisma.leaveType.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Congé Annuel',
      code: 'ANNUAL',
      isPaid: true,
      accrualRate: 2.5,
      color: '#3B82F6',
    }
  });

  const sickLeave = await prisma.leaveType.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Maladie',
      code: 'SICK',
      isPaid: true,
      color: '#EF4444',
    }
  });

  // 2. Salary Components
  console.log('💰 Creating Salary Components...');
  const baseSalary = await prisma.salaryComponent.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Salaire de Base',
      type: 'earning',
      isTaxable: true,
      isSocialSecurityApplicable: true,
    }
  });

  // 3. Employees
  console.log('👥 Creating Employees...');
  
  const hrManager = await prisma.employee.create({
    data: {
      companyId: COMPANY_ID,
      employeeCode: 'EMP-001',
      firstName: 'Sofiane',
      lastName: 'Belkacem',
      email: 'sofiane.b@atlaspeinture.dz',
      position: 'Directeur RH',
      department: 'Direction',
      hireDate: new Date('2020-01-15'),
      status: 'ACTIVE',
      contracts: {
        create: {
          contractType: 'CDI',
          startDate: new Date('2020-01-15'),
          salaryBaseAmount: 120000,
          isActive: true,
        }
      },
      leaveBalances: {
        create: {
          leaveTypeId: annualLeave.id,
          periodYear: 2026,
          totalEntitled: 30,
          usedDays: 5,
        }
      }
    }
  });

  const worker1 = await prisma.employee.create({
    data: {
      companyId: COMPANY_ID,
      employeeCode: 'EMP-102',
      firstName: 'Amine',
      lastName: 'Haddad',
      email: 'amine.h@atlaspeinture.dz',
      position: 'Opérateur de Production',
      department: 'Fabrication',
      hireDate: new Date('2022-06-01'),
      status: 'ACTIVE',
      managerId: hrManager.id,
      contracts: {
        create: {
          contractType: 'CDI',
          startDate: new Date('2022-06-01'),
          salaryBaseAmount: 45000,
          isActive: true,
        }
      },
      leaveBalances: {
        create: {
          leaveTypeId: annualLeave.id,
          periodYear: 2026,
          totalEntitled: 30,
          usedDays: 0,
        }
      }
    }
  });

  // 4. Recruitment
  console.log('📢 Creating Job Postings...');
  const job = await prisma.jobPosting.create({
    data: {
      companyId: COMPANY_ID,
      title: 'Technicien de Maintenance',
      department: 'Maintenance',
      description: 'Maintenance préventive et curative des machines de production.',
      status: JobStatus.OPEN,
    }
  });

  const candidate = await prisma.candidate.create({
    data: {
      companyId: COMPANY_ID,
      firstName: 'Karim',
      lastName: 'Ziani',
      email: 'karim.z@gmail.com',
      phone: '0550 11 22 33',
      status: CandidateStatus.NEW,
    }
  });

  await prisma.jobApplication.create({
    data: {
      jobPostingId: job.id,
      candidateId: candidate.id,
      stage: ApplicationStage.APPLIED,
    }
  });

  // 5. Performance
  console.log('📈 Creating Appraisal Cycle...');
  const cycle = await prisma.appraisalCycle.create({
    data: {
      companyId: COMPANY_ID,
      name: 'Évaluation Annuelle 2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: AppraisalStatus.PLANNED,
    }
  });

  await prisma.performanceReview.create({
    data: {
      cycleId: cycle.id,
      employeeId: worker1.id,
      reviewerId: hrManager.id,
      status: ReviewStatus.DRAFT,
    }
  });

  // 6. Payroll Period
  console.log('📅 Creating Payroll Period...');
  await prisma.payrollPeriod.create({
    data: {
      companyId: COMPANY_ID,
      periodStart: new Date('2026-04-01'),
      periodEnd: new Date('2026-04-30'),
      paymentDate: new Date('2026-05-02'),
      status: PayrollStatus.DRAFT,
    }
  });

  console.log('✅ HR Module seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
