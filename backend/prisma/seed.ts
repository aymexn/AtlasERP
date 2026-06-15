/**
 * ============================================================
 *  AtlasERP — Complete Simulation Seed
 *  Company  : Cameleon Colors (Peintures & Revêtements)
 *  Period   : December 2025 – June 2026 (7 months)
 *  Target   : aymenderouiche001@gmail.com
 * ============================================================
 */

import { PrismaClient, Role, UserStatus, SalesOrderStatus, InvoiceStatus, PaymentMethod, PurchaseOrderStatus, ReceptionStatus, MovementType, ProductType, ProductUnit, ArticleType, EmployeeStatus, ContractType, LeaveStatus, PayrollStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ─── HELPERS ───────────────────────────────────────────────
const addDays = (base: Date, days: number): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};
const D = (y: number, m: number, day: number): Date => new Date(Date.UTC(y, m - 1, day));
const rand = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const r2 = (n: number): number => Math.round(n * 100) / 100;
const seqRef = (prefix: string, n: number): string => `${prefix}-${String(n).padStart(3, '0')}`;

const WILAYAS = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif', 'Tizi Ouzou', 'Béjaïa', 'Skikda', 'Batna', 'Chlef', 'Jijel', 'Mostaganem', 'Tlemcen', 'Médéa'];
const TARGET_EMAIL = 'aymenderouiche001@gmail.com';
const PLAIN_PASSWORD = '18032004';

// ─── WEIGHTED PICK ─────────────────────────────────────────
const pickWeighted = (weights: { status: string; weight: number }[]): string => {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) { r -= w.weight; if (r <= 0) return w.status; }
  return weights[0].status;
};

// ─── MAIN ──────────────────────────────────────────────────
async function main() {
  console.log('\n🎨  AtlasERP Seed — Cameleon Colors');
  console.log('═'.repeat(50));

  // ── STEP 1: Find or create company ──────────────────────
  console.log('\n📍 Step 1: Locate / create company for', TARGET_EMAIL);

  let adminUser = await prisma.user.findFirst({ where: { email: TARGET_EMAIL } });
  let companyId: string;

  if (adminUser?.companyId) {
    companyId = adminUser.companyId;
    console.log('   ✓ Found existing company →', companyId);
  } else {
    const company = await prisma.company.create({
      data: {
        name: 'Cameleon Colors',
        slug: 'cameleon-colors',
        email: 'contact@cameleoncolors.dz',
        phone: '0550 12 34 56',
        address: '12, Zone Industrielle Rouïba, Alger',
        nif: '099612345678901',
        nis: '0996B1234567890',
        rc: '16/00-1234567B05',
        website: 'www.cameleoncolors.dz',
      },
    });
    companyId = company.id;
    console.log('   ✓ Created company:', company.name, '→', companyId);
  }

  // ── STEP 2: Clean existing data (FK-safe order) ─────────
  console.log('\n🗑️  Step 2: Cleaning existing data');

  const del = async (model: string, where: object) => {
    try {
      const result = await (prisma as any)[model].deleteMany({ where });
      if (result.count > 0) console.log(`   ✓ Deleted ${result.count} ${model}`);
    } catch (e: any) {
      console.warn(`   ⚠ Could not delete ${model}: ${e.message?.split('\n')[0]}`);
    }
  };

  // Collaboration / approval
  await del('approvalRequest',      { workflow: { companyId } });
  await del('approvalWorkflow',     { companyId });
  await del('collaborationDocument',{ companyId });
  await del('taskComment',          { task: { project: { companyId } } });
  await del('projectTask',          { project: { companyId } });
  await del('projectMilestone',     { project: { companyId } });
  await del('activityFeed',         { companyId });
  await del('project',              { companyId });

  // AI / notifications
  await del('aiChatHistory',        { companyId });
  await del('aiAutomation',         { companyId });
  await del('aiPrediction',         { companyId });
  await del('aiInsight',            { companyId });
  await del('notification',         { user: { companyId } });
  await del('calendarEvent',        { companyId });

  // Finance
  await del('collectionActivity',   { companyId });
  await del('payment',              { companyId });
  await del('invoice',              { companyId });
  await del('salesOrderLine',       { salesOrder: { companyId } });
  await del('salesOrder',           { companyId });

  // Purchase / stock
  await del('stockReceptionLine',   { reception: { companyId } });
  await del('stockReception',       { companyId });
  await del('purchaseOrderLine',    { purchaseOrder: { companyId } });
  await del('purchaseOrder',        { companyId });
  await del('stockMovement',        { companyId });

  // Manufacturing
  await del('manufacturingOrderLine',{ manufacturingOrder: { companyId } });
  await del('manufacturingOrder',   { companyId });

  // Products
  await del('supplierProduct',      { supplier: { companyId } });
  await del('reorderPoint',         { companyId });
  await del('deadStockItem',        { companyId });
  await del('stockTurnoverAnalytics',{ companyId });
  await del('abcClassification',    { companyId });
  await del('productStock',         { companyId });
  await del('productUom',           { product: { companyId } });
  await del('bomComponent',         { bom: { companyId } });
  await del('billOfMaterials',      { companyId });
  await del('product',              { companyId });
  await del('productFamily',        { companyId });
  await del('unitOfMeasure',        { companyId });
  await del('warehouse',            { companyId });

  // Customers / suppliers
  await del('activityLog',          { customer: { companyId } });
  await del('customerAnalytics',    { companyId });
  await del('customerAddress',      { companyId });
  await del('customerInteraction',  { companyId });
  await del('customerContact',      { companyId });
  await del('customer',             { companyId });
  await del('expense',              { companyId });
  await del('supplier',             { companyId });

  // HR
  await del('objective',            { review: { cycle: { companyId } } });
  await del('performanceReview',    { cycle: { companyId } });
  await del('appraisalCycle',       { companyId });
  await del('offer',                { application: { jobPosting: { companyId } } });
  await del('interview',            { application: { jobPosting: { companyId } } });
  await del('jobApplication',       { jobPosting: { companyId } });
  await del('candidate',            { companyId });
  await del('jobPosting',           { companyId });
  await del('payslip',              { employee: { companyId } });
  await del('payrollRun',           { employee: { companyId } });
  await del('payrollPeriod',        { companyId });
  await del('employeeSalaryComponent',{ employee: { companyId } });
  await del('salaryComponent',      { companyId });
  await del('leaveBalance',         { employee: { companyId } });
  await del('leaveRequest',         { employee: { companyId } });
  await del('leaveType',            { companyId });
  await del('contract',             { employee: { companyId } });
  await del('hrDocument',           { companyId });
  await del('publicHoliday',        { companyId });
  await del('employee',             { companyId });

  // Audit / KPIs
  await del('auditLog',             { companyId });
  await del('companyKpi',           { companyId });
  await del('supplierPerformanceMetric', { companyId });
  await del('stockMovementPattern', { companyId });

  // Users (non-admin)
  await prisma.user.deleteMany({ where: { companyId, email: { not: TARGET_EMAIL } } });
  console.log('   ✓ All existing data cleaned');

  // ── STEP 3: Update company & admin user ─────────────────
  console.log('\n🏢  Step 3: Configure company & admin');

  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: 'Cameleon Colors',
      email: 'contact@cameleoncolors.dz',
      phone: '0550 12 34 56',
      address: '12, Zone Industrielle Rouïba, Alger',
      nif: '099612345678901',
      nis: '0996B1234567890',
      rc: '16/00-1234567B05',
    },
  });

  const hashedPwd = await bcrypt.hash(PLAIN_PASSWORD, 10);

  adminUser = await prisma.user.upsert({
    where: { email: TARGET_EMAIL },
    update: { name: 'Aymen Derouiche', passwordHash: hashedPwd, role: 'ADMIN', companyId },
    create: { email: TARGET_EMAIL, name: 'Aymen Derouiche', passwordHash: hashedPwd, role: 'ADMIN', companyId },
  });
  console.log('   ✓ Admin user:', adminUser.email);

  // ── STEP 4: Additional users + employees ────────────────
  console.log('\n👥  Step 4: Creating employees');

  const userDefs = [
    { email: 'commercial@cameleoncolors.dz', name: 'Sofiane Mebarki',  role: 'COMMERCIAL' as Role,        position: 'Responsable Commercial', department: 'Ventes',              salary: 85000, hireDate: D(2023,3,1)  },
    { email: 'comptable@cameleoncolors.dz',  name: 'Nassima Belhadj',  role: 'ACCOUNTANT' as Role,        position: 'Comptable Principale',   department: 'Finance',             salary: 75000, hireDate: D(2022,9,15) },
    { email: 'magasin@cameleoncolors.dz',    name: 'Karim Oukaci',     role: 'WAREHOUSE_MANAGER' as Role, position: 'Responsable Magasin',    department: 'Logistique',          salary: 65000, hireDate: D(2021,6,1)  },
    { email: 'commercial2@cameleoncolors.dz',name: 'Samira Touati',    role: 'COMMERCIAL' as Role,        position: 'Attachée Commerciale',   department: 'Ventes',              salary: 70000, hireDate: D(2023,1,10) },
  ];

  const createdUsers: Record<string, any> = { [TARGET_EMAIL]: adminUser };
  for (const def of userDefs) {
    const u = await prisma.user.create({
      data: { email: def.email, name: def.name, passwordHash: hashedPwd, role: def.role, companyId },
    });
    createdUsers[def.email] = u;
  }

  // Employee records for all users
  const empDefs = [
    { email: TARGET_EMAIL,                    firstName: 'Aymen',   lastName: 'Derouiche', position: 'Directeur Général',    department: 'Direction', salary: 120000, hireDate: D(2020,1,15), code: 'EMP-001' },
    { email: 'commercial@cameleoncolors.dz',  firstName: 'Sofiane', lastName: 'Mebarki',   position: 'Responsable Commercial', department: 'Ventes',  salary: 85000,  hireDate: D(2023,3,1),  code: 'EMP-002' },
    { email: 'comptable@cameleoncolors.dz',   firstName: 'Nassima', lastName: 'Belhadj',   position: 'Comptable Principale', department: 'Finance',   salary: 75000,  hireDate: D(2022,9,15), code: 'EMP-003' },
    { email: 'magasin@cameleoncolors.dz',     firstName: 'Karim',   lastName: 'Oukaci',    position: 'Responsable Magasin',  department: 'Logistique',salary: 65000,  hireDate: D(2021,6,1),  code: 'EMP-004' },
    { email: 'commercial2@cameleoncolors.dz', firstName: 'Samira',  lastName: 'Touati',    position: 'Attachée Commerciale', department: 'Ventes',    salary: 70000,  hireDate: D(2023,1,10), code: 'EMP-005' },
  ];

  const employees: Record<string, any> = {};
  for (const def of empDefs) {
    const u = createdUsers[def.email];
    const emp = await prisma.employee.create({
      data: {
        companyId,
        userId: u.id,
        employeeCode: def.code,
        firstName: def.firstName,
        lastName: def.lastName,
        email: def.email,
        phone: `077${rand(1000000,9999999)}`,
        position: def.position,
        department: def.department,
        hireDate: def.hireDate,
        status: EmployeeStatus.ACTIVE,
        address: `${rand(1,50)}, Rue ${rand(1,20)}, ${pick(WILAYAS)}`,
        bankName: pick(['BNA','CPA','BADR','BDL','BEA']),
        bankAccountIban: `DZ59 00${rand(10,99)} 00${rand(100,999)} ${rand(10000000,99999999)}`,
      },
    });
    employees[def.email] = { ...emp, salary: def.salary };
  }

  // Create contracts for each employee
  for (const def of empDefs) {
    const emp = employees[def.email];
    await prisma.contract.create({
      data: {
        employeeId: emp.id,
        contractType: ContractType.CDI,
        startDate: def.hireDate,
        salaryBaseAmount: def.salary,
        salaryCurrency: 'DZD',
        salaryFrequency: 'monthly',
        positionTitle: def.position,
        department: def.department,
        isActive: true,
      },
    });
  }

  const adminEmp = employees[TARGET_EMAIL];
  console.log(`   ✓ ${Object.keys(employees).length} employees + contracts created`);

  // ── STEP 5: Leave types & balances ──────────────────────
  console.log('\n🏖️  Step 5: Leave types & balances');

  // LeaveType code must be globally unique — use company-scoped codes
  const ltDefs = [
    { name: 'Congé Annuel',       code: `CA-${companyId.slice(0,8)}`,  isPaid: true,  accrualRate: 2.5 },
    { name: 'Congé Maladie',      code: `CM-${companyId.slice(0,8)}`,  isPaid: true,  accrualRate: 0   },
    { name: 'Congé Maternité',    code: `MAT-${companyId.slice(0,8)}`, isPaid: true,  accrualRate: 0   },
    { name: 'Congé Paternité',    code: `PAT-${companyId.slice(0,8)}`, isPaid: true,  accrualRate: 0   },
    { name: 'Congé Sans Solde',   code: `CSS-${companyId.slice(0,8)}`, isPaid: false, accrualRate: 0   },
    { name: 'Congé Exceptionnel', code: `CEX-${companyId.slice(0,8)}`, isPaid: true,  accrualRate: 0   },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of ltDefs) {
    const created = await prisma.leaveType.create({
      data: { companyId, name: lt.name, code: lt.code, isPaid: lt.isPaid, accrualRate: lt.accrualRate, isActive: true },
    });
    leaveTypes[lt.name] = created;
  }

  const annualLT = leaveTypes['Congé Annuel'];
  const sickLT   = leaveTypes['Congé Maladie'];
  const excLT    = leaveTypes['Congé Exceptionnel'];

  for (const emp of Object.values(employees)) {
    await prisma.leaveBalance.create({ data: { employeeId: emp.id, leaveTypeId: annualLT.id, periodYear: 2026, totalEntitled: 30, usedDays: 0, pendingDays: 0, carriedFromPrevious: 5 } });
    await prisma.leaveBalance.create({ data: { employeeId: emp.id, leaveTypeId: sickLT.id,   periodYear: 2026, totalEntitled: 15, usedDays: 0, pendingDays: 0, carriedFromPrevious: 0 } });
  }

  const empList = Object.values(employees);
  await prisma.leaveRequest.create({ data: { employeeId: empList[1].id, leaveTypeId: annualLT.id, startDate: D(2026,1,15), endDate: D(2026,1,25), totalDays: 8, reason: 'Vacances en famille', status: LeaveStatus.APPROVED, approvedByManager: adminEmp.id } });
  await prisma.leaveRequest.create({ data: { employeeId: empList[0].id, leaveTypeId: annualLT.id, startDate: D(2026,4,7),  endDate: D(2026,4,11), totalDays: 4, reason: 'Congé printemps', status: LeaveStatus.APPROVED, approvedByManager: adminEmp.id } });
  await prisma.leaveRequest.create({ data: { employeeId: empList[2].id, leaveTypeId: sickLT.id,   startDate: D(2026,3,3),  endDate: D(2026,3,5),  totalDays: 3, reason: 'Maladie', status: LeaveStatus.APPROVED, approvedByManager: adminEmp.id } });
  await prisma.leaveRequest.create({ data: { employeeId: empList[3].id, leaveTypeId: excLT.id,    startDate: D(2026,2,10), endDate: D(2026,2,12), totalDays: 2, reason: 'Événement familial', status: LeaveStatus.PENDING } });

  console.log('   ✓ Leave types, balances, and requests created');

  // ── STEP 6: Payroll periods & runs ──────────────────────
  console.log('\n💰  Step 6: Payroll periods & payslips');

  const calcIRG = (monthly: number): number => {
    const annual = monthly * 12;
    let irg = 0;
    if (annual <= 120000) irg = 0;
    else if (annual <= 360000) irg = (annual - 120000) * 0.23;
    else if (annual <= 1440000) irg = 55200 + (annual - 360000) * 0.27;
    else irg = 346200 + (annual - 1440000) * 0.30;
    return r2(irg / 12);
  };

  const payMonths = [
    { year: 2025, month: 12, status: PayrollStatus.PAID },
    { year: 2026, month: 1,  status: PayrollStatus.PAID },
    { year: 2026, month: 2,  status: PayrollStatus.PAID },
    { year: 2026, month: 3,  status: PayrollStatus.PAID },
    { year: 2026, month: 4,  status: PayrollStatus.PAID },
    { year: 2026, month: 5,  status: PayrollStatus.VALIDATED },
    { year: 2026, month: 6,  status: PayrollStatus.CALCULATED },
  ];

  for (const pm of payMonths) {
    const lastDay = new Date(Date.UTC(pm.year, pm.month, 0)).getDate();
    const payDate = addDays(D(pm.year, pm.month, lastDay), 2);
    const period = await prisma.payrollPeriod.create({
      data: {
        companyId,
        periodStart: D(pm.year, pm.month, 1),
        periodEnd:   D(pm.year, pm.month, lastDay),
        paymentDate: payDate,
        status: pm.status,
        locked: pm.status === PayrollStatus.PAID,
      },
    });

    for (const emp of Object.values(employees)) {
      const baseSalary = emp.salary;
      const yearsExp = Math.max(0, Math.floor((D(pm.year, pm.month, 1).getTime() - new Date(emp.hireDate).getTime()) / (365.25 * 24 * 3600 * 1000)));
      const primeAnc = yearsExp >= 3 ? r2(Math.min(baseSalary * 0.01 * yearsExp, baseSalary * 0.25)) : 0;
      const gross = r2(baseSalary + primeAnc);
      const cnas = r2(gross * 0.09);
      const netImposable = r2(gross - cnas);
      const irg = calcIRG(netImposable);
      const net = r2(netImposable - irg);

      const details = { baseSalary, primeAnciennete: primeAnc, cnas, irg, netImposable };

      const run = await prisma.payrollRun.create({
        data: {
          payrollPeriodId: period.id,
          employeeId: emp.id,
          grossSalary: gross,
          totalEarnings: gross,
          totalDeductions: r2(cnas + irg),
          netSalary: net,
          employerCost: r2(gross * 1.26),
          status: pm.status === PayrollStatus.PAID ? 'paid' : pm.status === PayrollStatus.VALIDATED ? 'validated' : 'calculated',
          calculationDetails: details,
        },
      });

      if (pm.status === PayrollStatus.PAID) {
        await prisma.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: emp.id,
            periodStart: period.periodStart,
            periodEnd:   period.periodEnd,
            filePath: `/uploads/payslips/payslip_${run.id}.pdf`,
            generatedAt: payDate,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${payMonths.length} payroll periods created`);

  // ── STEP 7: Warehouse ────────────────────────────────────
  console.log('\n🏭  Step 7: Warehouse');

  const warehouse = await prisma.warehouse.create({
    data: { companyId, name: 'Entrepôt Principal', code: 'WH-001', location: 'Zone Industrielle Rouïba, Alger', isActive: true },
  });

  // ── STEP 8: Product families ─────────────────────────────
  console.log('\n📦  Step 8: Product families & products');

  const famDefs = [
    { name: 'Peintures Intérieures', code: 'PINT' },
    { name: 'Peintures Extérieures', code: 'PEXT' },
    { name: 'Peintures Industrielles', code: 'PIND' },
    { name: 'Apprêts & Primaires', code: 'APPR' },
    { name: 'Solvants & Diluants', code: 'SOLV' },
    { name: 'Outillage & Accessoires', code: 'OUTI' },
  ];
  const families: Record<string, any> = {};
  for (const f of famDefs) {
    const fam = await prisma.productFamily.create({ data: { companyId, name: f.name, code: f.code, isActive: true } });
    families[f.code] = fam;
  }

  // ── STEP 9: Products (30) ────────────────────────────────
  const prodDefs = [
    // PEINTURES INTÉRIEURES
    { sku:'PI-001', name:'Peinture Vinylique Blanc Mat 10L',   fam:'PINT', unit:ProductUnit.UNIT, price:2200, cost:1400, stock:85,  reorder:20, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PI-002', name:'Peinture Vinylique Blanc Satin 10L', fam:'PINT', unit:ProductUnit.UNIT, price:2450, cost:1550, stock:60,  reorder:15, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PI-003', name:'Peinture Acrylique Colorée 1L',      fam:'PINT', unit:ProductUnit.L,    price:950,  cost:580,  stock:120, reorder:30, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PI-004', name:'Peinture Plafond Blanc 5L',          fam:'PINT', unit:ProductUnit.UNIT, price:1100, cost:680,  stock:45,  reorder:10, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PI-005', name:'Peinture Glycérophtalique Mat 2.5L', fam:'PINT', unit:ProductUnit.UNIT, price:1350, cost:850,  stock:38,  reorder:10, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PI-006', name:'Peinture Anti-Humidité 5L',          fam:'PINT', unit:ProductUnit.UNIT, price:2800, cost:1800, stock:22,  reorder:8,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    // PEINTURES EXTÉRIEURES
    { sku:'PE-001', name:'Peinture Façade Blanc Pur 10L',      fam:'PEXT', unit:ProductUnit.UNIT, price:3200, cost:2000, stock:70,  reorder:20, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PE-002', name:'Peinture Façade Colorée 10L',        fam:'PEXT', unit:ProductUnit.UNIT, price:3500, cost:2200, stock:45,  reorder:12, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PE-003', name:'Peinture Imperméabilisante 15L',     fam:'PEXT', unit:ProductUnit.UNIT, price:5500, cost:3400, stock:30,  reorder:8,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PE-004', name:'Enduit de Façade 25Kg',              fam:'PEXT', unit:ProductUnit.KG,   price:1800, cost:1100, stock:55,  reorder:15, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PE-005', name:'Peinture Sol Béton 5L',              fam:'PEXT', unit:ProductUnit.UNIT, price:2100, cost:1300, stock:18,  reorder:5,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    // PEINTURES INDUSTRIELLES
    { sku:'PIN-001', name:'Peinture Anticorrosion Gris 5L',   fam:'PIND', unit:ProductUnit.UNIT, price:3800, cost:2400, stock:25,  reorder:8,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PIN-002', name:'Peinture Époxy Bicomposant 5L',    fam:'PIND', unit:ProductUnit.UNIT, price:6500, cost:4200, stock:15,  reorder:5,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PIN-003', name:'Primaire Antirouille Rouge 1L',    fam:'PIND', unit:ProductUnit.L,    price:1200, cost:750,  stock:40,  reorder:10, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'PIN-004', name:'Peinture Bitumineuse Noire 5L',    fam:'PIND', unit:ProductUnit.UNIT, price:2400, cost:1500, stock:20,  reorder:6,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    // APPRÊTS & PRIMAIRES
    { sku:'AP-001', name:"Apprêt Mur Intérieur 10L",          fam:'APPR', unit:ProductUnit.UNIT, price:1600, cost:980,  stock:65,  reorder:15, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'AP-002', name:"Primaire d'Accrochage Universel 5L",fam:'APPR', unit:ProductUnit.UNIT, price:1950, cost:1200, stock:40,  reorder:10, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'AP-003', name:'Enduit de Rebouchage 5Kg',          fam:'APPR', unit:ProductUnit.KG,   price:850,  cost:520,  stock:80,  reorder:20, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'AP-004', name:'Enduit Lissé Poudre 25Kg',          fam:'APPR', unit:ProductUnit.KG,   price:1200, cost:740,  stock:90,  reorder:25, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'AP-005', name:'Bouche-Pore Bois 1L',               fam:'APPR', unit:ProductUnit.L,    price:780,  cost:480,  stock:35,  reorder:8,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    // SOLVANTS & DILUANTS
    { sku:'SV-001', name:'White-Spirit 1L',                   fam:'SOLV', unit:ProductUnit.L,    price:320,  cost:190,  stock:150, reorder:40, type:ProductType.RAW_MATERIAL, art:ArticleType.RAW_MATERIAL },
    { sku:'SV-002', name:'Diluant Nitrocellulosique 1L',      fam:'SOLV', unit:ProductUnit.L,    price:450,  cost:270,  stock:100, reorder:30, type:ProductType.RAW_MATERIAL, art:ArticleType.RAW_MATERIAL },
    { sku:'SV-003', name:'Acétone Pure 500ml',                fam:'SOLV', unit:ProductUnit.L,    price:280,  cost:160,  stock:80,  reorder:20, type:ProductType.RAW_MATERIAL, art:ArticleType.RAW_MATERIAL },
    { sku:'SV-004', name:'Décapant Chimique 2.5L',            fam:'SOLV', unit:ProductUnit.UNIT, price:950,  cost:580,  stock:45,  reorder:12, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    // OUTILLAGE & ACCESSOIRES
    { sku:'OT-001', name:'Rouleau Peinture 23cm',              fam:'OUTI', unit:ProductUnit.PCS,  price:580,  cost:320,  stock:200, reorder:50, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'OT-002', name:'Pinceau Professionnel 60mm',         fam:'OUTI', unit:ProductUnit.PCS,  price:350,  cost:190,  stock:180, reorder:40, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'OT-003', name:'Plateau de Peinture + Grille',       fam:'OUTI', unit:ProductUnit.PCS,  price:280,  cost:150,  stock:120, reorder:30, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'OT-004', name:'Bâche de Protection 4x5m',           fam:'OUTI', unit:ProductUnit.PCS,  price:650,  cost:380,  stock:90,  reorder:20, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'OT-005', name:'Ruban Adhésif Masquage 25mm x 50m', fam:'OUTI', unit:ProductUnit.PCS,  price:180,  cost:95,   stock:300, reorder:80, type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
    { sku:'OT-006', name:'Pistolet à Peinture Airless',        fam:'OUTI', unit:ProductUnit.PCS,  price:18500,cost:12000,stock:5,   reorder:2,  type:ProductType.FINISHED_GOOD,  art:ArticleType.FINISHED_PRODUCT },
  ];

  const products: Record<string, any> = {};
  for (const p of prodDefs) {
    const prod = await prisma.product.create({
      data: {
        companyId,
        sku: p.sku,
        name: p.name,
        familyId: families[p.fam].id,
        unit: p.unit,
        salePriceHt: p.price,
        purchasePriceHt: p.cost,
        standardCost: p.cost,
        stockQuantity: p.stock,
        reorderPoint: p.reorder,
        minStock: p.reorder,
        type: p.type,
        articleType: p.art,
        taxRate: 0.19,
        isActive: true,
        description: `${p.name} — Cameleon Colors`,
      },
    });
    // Create ProductStock for the warehouse
    await prisma.productStock.create({
      data: { companyId, productId: prod.id, warehouseId: warehouse.id, quantity: p.stock, reservedQuantity: 0 },
    });
    products[p.sku] = prod;
  }

  console.log(`   ✓ ${Object.keys(families).length} families, ${Object.keys(products).length} products`);

  // ── STEP 10: Suppliers ───────────────────────────────────
  console.log('\n🏭  Step 10: Suppliers');

  const supplierDefs = [
    { name: 'SARL Chimie Industrielle Algérie', email:'contact@chimieind.dz',  phone:'0551122334', city:'Alger',      terms:30 },
    { name: 'SPA Matières Premières Ouest',     email:'commande@mpouest.dz',   phone:'0562233445', city:'Oran',       terms:45 },
    { name: 'EURL Pigments & Liants',           email:'info@pigliants.dz',     phone:'0573344556', city:'Blida',      terms:30 },
    { name: 'SARL Emballages Plastiques Est',   email:'vente@emballest.dz',    phone:'0554455667', city:'Annaba',     terms:60 },
    { name: 'SPA Solvants & Huiles',            email:'export@solvhui.dz',     phone:'0565566778', city:'Sétif',      terms:30 },
    { name: 'EURL Outillage Professionnel',     email:'devis@outipro.dz',      phone:'0576677889', city:'Constantine',terms:15 },
  ];

  const suppliers: any[] = [];
  for (const s of supplierDefs) {
    const sup = await prisma.supplier.create({
      data: {
        companyId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: `Zone Industrielle, ${s.city}`,
        city: s.city,
        country: 'DZ',
        paymentTermsDays: s.terms,
        isActive: true,
      },
    });
    suppliers.push(sup);
  }
  console.log(`   ✓ ${suppliers.length} suppliers created`);

  // ── STEP 11: Customers (30) ──────────────────────────────
  console.log('\n👤  Step 11: Creating 30 customers');

  const customerDefs = [
    { name:'SARL Construction Moderne',          contact:'Mohamed Bensalem',    email:'contact@constmod.dz',          phone:'0551234567', wilaya:'Alger',       credit:500000 },
    { name:'EURL Bâtisseurs du Nord',            contact:'Rachid Hamani',       email:'r.hamani@batisseursnord.dz',   phone:'0562345678', wilaya:'Constantine', credit:350000 },
    { name:'SPA Immobilière El Djazair',         contact:'Fatima Zerrouk',      email:'f.zerrouk@immoeldjazair.dz',  phone:'0573456789', wilaya:'Oran',        credit:800000 },
    { name:'SARL Travaux Publics MENA',          contact:'Abdelkader Messaoudi',email:'a.messaoudi@tpmena.dz',        phone:'0554567890', wilaya:'Blida',       credit:600000 },
    { name:'EURL Déco & Rénovation',             contact:'Nadia Benali',        email:'n.benali@decorenov.dz',        phone:'0565678901', wilaya:'Tizi Ouzou',  credit:200000 },
    { name:'SNC Habitat Luxe',                   contact:'Karim Boudiaf',       email:'k.boudiaf@habitatluxe.dz',    phone:'0576789012', wilaya:'Annaba',      credit:450000 },
    { name:'SARL BTP Chantiers Réunis',          contact:'Salim Amrani',        email:'s.amrani@chantiersr.dz',      phone:'0557890123', wilaya:'Sétif',       credit:700000 },
    { name:'EURL Peintures & Revêtements Est',   contact:'Hocine Meziane',      email:'h.meziane@preest.dz',         phone:'0568901234', wilaya:'Béjaïa',      credit:300000 },
    { name:'SPA Groupe Logement Social',         contact:'Yasmina Kaci',        email:'y.kaci@gls.dz',               phone:'0579012345', wilaya:'Médéa',       credit:1000000},
    { name:'SARL Entreprise Benmahmoud',         contact:'Cherif Benmahmoud',   email:'c.benmahmoud@ebenm.dz',       phone:'0550123456', wilaya:'Skikda',      credit:250000 },
    { name:'EURL Toits & Murs Algérie',          contact:'Amina Ourahmoun',     email:'a.ourahmoun@toitsmuirs.dz',   phone:'0561234567', wilaya:'Batna',       credit:380000 },
    { name:'SARL Constructions Durables',        contact:'Mahmoud Ferhat',      email:'m.ferhat@constdur.dz',        phone:'0572345678', wilaya:'Chlef',       credit:420000 },
    { name:'EURL Finitions Parfaites',           contact:'Lynda Hamidouche',    email:'l.hamidouche@finperf.dz',     phone:'0553456789', wilaya:'Tlemcen',     credit:180000 },
    { name:'SPA Promoteur Al Baraka',            contact:'Omar Belkacemi',      email:'o.belkacemi@albaraka.dz',     phone:'0564567890', wilaya:'Mostaganem',  credit:550000 },
    { name:'SARL Maçonnerie & Enduits Boukhari', contact:'Fethi Boukhari',      email:'f.boukhari@mebk.dz',          phone:'0575678901', wilaya:'Alger',       credit:320000 },
    { name:'EURL Rénovation Express',            contact:'Sara Bouziani',       email:'s.bouziani@renovexpress.dz',  phone:'0556789012', wilaya:'Constantine', credit:230000 },
    { name:'SNC Architecture & Design',          contact:'Yacine Laouar',       email:'y.laouar@archdesign.dz',      phone:'0567890123', wilaya:'Oran',        credit:290000 },
    { name:'SARL Chantiers du Maghreb',          contact:'Abderrahmane Taibi',  email:'a.taibi@chantiermag.dz',      phone:'0578901234', wilaya:'Jijel',       credit:410000 },
    { name:'EURL Bâtiment & Technique',          contact:'Meriem Berber',       email:'m.berber@battech.dz',         phone:'0559012345', wilaya:'Annaba',      credit:360000 },
    { name:'SPA Constructions Modernes Est',     contact:'Djamel Cherifi',      email:'d.cherifi@cmest.dz',          phone:'0550234567', wilaya:'Alger',       credit:620000 },
    { name:'SARL Peintures Professionnelles',    contact:'Nassim Hadj',         email:'n.hadj@peinpro.dz',           phone:'0561345678', wilaya:'Blida',       credit:190000 },
    { name:'EURL Espace Couleur',                contact:'Souad Terki',         email:'s.terki@espacecouleur.dz',    phone:'0572456789', wilaya:'Sétif',       credit:160000 },
    { name:'SARL Habitat 21',                    contact:'Mourad Benzerga',     email:'m.benzerga@habitat21.dz',     phone:'0553567890', wilaya:'Tizi Ouzou',  credit:480000 },
    { name:'EURL Travaux Tous Corps État',       contact:'Leila Mansouri',      email:'l.mansouri@ttce.dz',          phone:'0564678901', wilaya:'Béjaïa',      credit:270000 },
    { name:'SPA Groupe Bâtir Ensemble',          contact:'Hamid Djemai',        email:'h.djemai@batirens.dz',        phone:'0575789012', wilaya:'Batna',       credit:740000 },
    { name:'SARL Réhabilitation Urbaine',        contact:'Widad Cheurfi',       email:'w.cheurfi@rehab-urb.dz',      phone:'0556890123', wilaya:'Chlef',       credit:330000 },
    { name:'EURL Matériaux & Constructions',     contact:'Tahar Bouchair',      email:'t.bouchair@matcons.dz',       phone:'0567901234', wilaya:'Alger',       credit:510000 },
    { name:'SNC Artisanat & Bâtiment',          contact:'Nadia Selmi',         email:'n.selmi@artbatim.dz',         phone:'0578012345', wilaya:'Constantine', credit:140000 },
    { name:'SARL Finitions & Décorations Ouest', contact:'Kamel Haddar',       email:'k.haddar@findeco.dz',          phone:'0559123456', wilaya:'Oran',        credit:290000 },
    { name:'EURL Solutions Bâtiment Pro',        contact:'Djamila Khelif',     email:'d.khelif@solbatpro.dz',        phone:'0550345678', wilaya:'Médéa',       credit:220000 },
  ];

  const customers: any[] = [];
  for (const c of customerDefs) {
    const cust = await prisma.customer.create({
      data: {
        companyId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: `${rand(1,99)}, Rue ${rand(1,50)}, ${c.wilaya}`,
        creditLimit: c.credit,
        isActive: true,
        notes: `Client ${c.wilaya} — Secteur BTP`,
      },
    });
    await prisma.customerContact.create({
      data: { companyId, customerId: cust.id, name: c.contact, email: c.email, phone: c.phone, isPrimary: true, position: 'Responsable Achats' },
    });
    customers.push(cust);
  }
  console.log(`   ✓ ${customers.length} customers created`);

  // ── STEP 12: Sales Orders (~50) ──────────────────────────
  console.log('\n🛒  Step 12: Sales orders & lines');

  const paintSkus  = ['PI-001','PI-002','PI-003','PI-004','PE-001','PE-002','PE-003'];
  const toolSkus   = ['OT-001','OT-002','OT-003','OT-004','OT-005'];
  const primSkus   = ['AP-001','AP-002','AP-003','AP-004'];

  const orderBatches = [
    { year:2025, month:12, count:6, weights:[{status:'INVOICED',weight:5},{status:'CONFIRMED',weight:1}] },
    { year:2026, month:1,  count:7, weights:[{status:'INVOICED',weight:5},{status:'CONFIRMED',weight:2}] },
    { year:2026, month:2,  count:7, weights:[{status:'INVOICED',weight:4},{status:'CONFIRMED',weight:2},{status:'SHIPPED',weight:1}] },
    { year:2026, month:3,  count:8, weights:[{status:'INVOICED',weight:5},{status:'CONFIRMED',weight:2},{status:'CANCELLED',weight:1}] },
    { year:2026, month:4,  count:8, weights:[{status:'INVOICED',weight:4},{status:'CONFIRMED',weight:2},{status:'SHIPPED',weight:2}] },
    { year:2026, month:5,  count:8, weights:[{status:'VALIDATED',weight:3},{status:'INVOICED',weight:3},{status:'SHIPPED',weight:2}] },
    { year:2026, month:6,  count:6, weights:[{status:'DRAFT',weight:2},{status:'VALIDATED',weight:2},{status:'SHIPPED',weight:2}] },
  ];

  const salesOrders: any[] = [];
  let orderNum = 1;

  for (const batch of orderBatches) {
    for (let i = 0; i < batch.count; i++) {
      const orderDate = D(batch.year, batch.month, rand(1, 28));
      const status = pickWeighted(batch.weights) as SalesOrderStatus;
      const customer = pick(customers);

      const skuPool = [
        ...paintSkus.slice(0, rand(1, paintSkus.length)),
        ...toolSkus.slice(0, rand(0, 2)),
        ...primSkus.slice(0, rand(0, 2)),
      ];
      const selectedSkus = [...new Set(skuPool)].slice(0, rand(2, 5));

      let totalHT = 0;
      const lines: any[] = [];
      for (const sku of selectedSkus) {
        const prod = products[sku];
        if (!prod) continue;
        const qty = rand(5, 40);
        const unitPrice = r2(Number(prod.salePriceHt) * (1 - rand(0,5)/100));
        const lineHT = r2(qty * unitPrice);
        const lineTTC = r2(lineHT * 1.19);
        totalHT += lineHT;
        lines.push({ productId: prod.id, quantity: qty, unit: prod.unit, unitPriceHt: unitPrice, unitCostSnapshot: Number(prod.standardCost), lineTotalHt: lineHT, lineTotalTtc: lineTTC, taxRate: 0.19 });
      }

      const tva   = r2(totalHT * 0.19);
      const totalTTC = r2(totalHT + tva);

      const order = await prisma.salesOrder.create({
        data: {
          companyId,
          reference: seqRef('BC', orderNum++),
          customerId: customer.id,
          date: orderDate,
          dueDate: addDays(orderDate, rand(7,30)),
          status,
          totalAmountHt: totalHT,
          totalAmountTva: tva,
          totalAmountTtc: totalTTC,
          notes: pick(['Livraison chantier','Commande urgente','Renouvellement contrat',null,null]),
          lines: { create: lines },
        },
        include: { lines: true },
      });

      salesOrders.push(order);
    }
  }
  console.log(`   ✓ ${salesOrders.length} sales orders created`);

  // ── STEP 13: Invoices (~60) ──────────────────────────────
  console.log('\n🧾  Step 13: Invoices & payments');

  const invoicedOrders = salesOrders.filter(o => ['INVOICED'].includes(o.status));
  const invoices: any[] = [];
  let invNum = 1;

  for (const order of invoicedOrders) {
    const invDate = addDays(order.date, rand(1,5));
    const dueDate  = addDays(invDate, rand(15,60));
    const totalTTC = Number(order.totalAmountTtc);

    const inv = await prisma.invoice.create({
      data: {
        companyId,
        reference: seqRef('FAC', invNum++),
        customerId: order.customerId,
        salesOrderId: order.id,
        date: invDate,
        dueDate,
        totalAmountHt: order.totalAmountHt,
        totalAmountTva: order.totalAmountTva,
        totalAmountTtc: order.totalAmountTtc,
        amountPaid: 0,
        amountRemaining: order.totalAmountTtc,
        status: InvoiceStatus.SENT,
        notes: `Facture suite commande ${order.reference}`,
      },
    });
    invoices.push({ ...inv, dueDate, totalTTC });
  }

  // Stand-alone invoices for CONFIRMED orders
  const confirmedOrders = salesOrders.filter(o => o.status === 'CONFIRMED').slice(0, 8);
  for (const order of confirmedOrders) {
    const invDate = addDays(order.date, rand(3,7));
    const dueDate  = addDays(invDate, 30);
    const inv = await prisma.invoice.create({
      data: {
        companyId,
        reference: seqRef('FAC', invNum++),
        customerId: order.customerId,
        salesOrderId: order.id,
        date: invDate,
        dueDate,
        totalAmountHt: order.totalAmountHt,
        totalAmountTva: order.totalAmountTva,
        totalAmountTtc: order.totalAmountTtc,
        amountPaid: 0,
        amountRemaining: order.totalAmountTtc,
        status: InvoiceStatus.SENT,
      },
    });
    invoices.push({ ...inv, dueDate, totalTTC: Number(order.totalAmountTtc) });
  }

  // Payments
  let paymentCount = 0;
  const now = new Date();
  let payNum = 1;

  for (const inv of invoices) {
    const dueDate = new Date(inv.dueDate);
    const isPast  = dueDate < now;
    const totalTTC = Number(inv.totalAmountTtc ?? inv.totalTTC);
    const scenario = rand(1,10);

    if (scenario <= 6 && isPast) {
      // Full payment
      const payDate = addDays(new Date(inv.date), rand(10,55));
      const method  = pick([PaymentMethod.TRANSFER, PaymentMethod.CHECK, PaymentMethod.CASH]);
      await prisma.payment.create({
        data: { companyId, invoiceId: inv.id, date: payDate, amount: totalTTC, method, reference: seqRef('PAY', payNum++), notes: 'Règlement facture' },
      });
      await prisma.invoice.update({ where: { id: inv.id }, data: { amountPaid: totalTTC, amountRemaining: 0, status: InvoiceStatus.PAID } });
      paymentCount++;
    } else if (scenario <= 8 && isPast) {
      // Partial payment
      const partial = r2(totalTTC * (rand(30,70)/100));
      const payDate = addDays(new Date(inv.date), rand(15,45));
      const method  = pick([PaymentMethod.TRANSFER, PaymentMethod.CHECK]);
      await prisma.payment.create({
        data: { companyId, invoiceId: inv.id, date: payDate, amount: partial, method, reference: seqRef('PAY', payNum++), notes: 'Acompte partiel' },
      });
      await prisma.invoice.update({ where: { id: inv.id }, data: { amountPaid: partial, amountRemaining: r2(totalTTC - partial), status: InvoiceStatus.PARTIAL } });
      paymentCount++;
    }
    // else: stays SENT / OVERDUE
  }

  console.log(`   ✓ ${invoices.length} invoices, ${paymentCount} payments`);

  // ── STEP 14: Purchase orders (~15) ──────────────────────
  console.log('\n📥  Step 14: Purchase orders & receptions');

  const rawSkus = ['SV-001','SV-002','SV-003','AP-003','AP-004','OT-001','OT-002','OT-005'];
  const poMonths = [
    { year:2025, month:12 }, { year:2026, month:1 }, { year:2026, month:2 },
    { year:2026, month:3  }, { year:2026, month:4  }, { year:2026, month:5 },
  ];

  let poNum = 1;
  let receptionRef = 1;

  for (const pm of poMonths) {
    const count = rand(2, 3);
    for (let i = 0; i < count && poNum <= 15; i++) {
      const supplier = pick(suppliers);
      const poDate   = D(pm.year, pm.month, rand(1,25));
      const isOld    = pm.month < 5 || pm.year === 2025;
      const poStatus = isOld ? PurchaseOrderStatus.FULLY_RECEIVED : pick([PurchaseOrderStatus.SENT, PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED]);

      const skusForPO = rawSkus.slice(0, rand(2,4));
      const poLines: any[] = [];
      let poTotalHT = 0;

      for (const sku of skusForPO) {
        const prod = products[sku];
        if (!prod) continue;
        const qty = rand(50, 200);
        const costPrice = r2(Number(prod.standardCost) * (1 - rand(0,3)/100));
        const lineTotal = r2(qty * costPrice);
        poTotalHT += lineTotal;
        poLines.push({ productId: prod.id, quantity: qty, unit: prod.unit, unitPriceHt: costPrice, totalHt: lineTotal, receivedQty: poStatus === PurchaseOrderStatus.FULLY_RECEIVED ? qty : 0 });
      }

      const poTVA = r2(poTotalHT * 0.19);

      const po = await prisma.purchaseOrder.create({
        data: {
          companyId,
          reference: seqRef('AC', poNum++),
          supplierId: supplier.id,
          orderDate: poDate,
          expectedDate: addDays(poDate, rand(7,21)),
          status: poStatus,
          totalHt: poTotalHT,
          totalTva: poTVA,
          totalTtc: r2(poTotalHT + poTVA),
          notes: 'Réapprovisionnement stock',
          lines: { create: poLines },
        },
        include: { lines: true },
      });

      if (poStatus === PurchaseOrderStatus.FULLY_RECEIVED) {
        const receptionDate = addDays(poDate, rand(7,14));
        const reception = await prisma.stockReception.create({
          data: {
            companyId,
            reference: seqRef('BL', receptionRef++),
            purchaseOrderId: po.id,
            warehouseId: warehouse.id,
            status: ReceptionStatus.VALIDATED,
            receivedAt: receptionDate,
            validatedAt: receptionDate,
            notes: 'Réception conforme',
          },
        });

        // Create reception lines and stock movements
        for (const line of po.lines) {
          await prisma.stockReceptionLine.create({
            data: {
              receptionId: reception.id,
              productId: line.productId,
              purchaseLineId: line.id,
              expectedQty: line.quantity,
              receivedQty: line.quantity,
              unit: line.unit,
              unitCost: line.unitPriceHt,
            },
          });

          await prisma.stockMovement.create({
            data: {
              companyId,
              productId: line.productId,
              quantity: line.quantity,
              movementType: 'IN',
              type: MovementType.IN,
              reference: seqRef('BL', receptionRef - 1),
              reason: 'Réception commande fournisseur',
              date: receptionDate,
              unitCost: line.unitPriceHt,
              totalCost: r2(Number(line.quantity) * Number(line.unitPriceHt)),
              unit: line.unit,
              warehouseToId: warehouse.id,
              createdBy: adminUser!.id,
            },
          });
        }
      }
    }
  }
  console.log(`   ✓ ${poNum - 1} purchase orders + receptions`);

  // ── STEP 15: Stock movements for sales ───────────────────
  console.log('\n📊  Step 15: Stock out movements for sales');

  const shippedOrders = salesOrders.filter(o => ['INVOICED','CONFIRMED','SHIPPED'].includes(o.status));
  let mvtCount = 0;
  for (const order of shippedOrders.slice(0, 30)) {
    for (const line of order.lines) {
      await prisma.stockMovement.create({
        data: {
          companyId,
          productId: line.productId,
          quantity: line.quantity,
          movementType: 'OUT',
          type: MovementType.OUT,
          reference: order.reference,
          reason: 'Expédition commande client',
          date: order.date,
          unitCost: line.unitCostSnapshot,
          totalCost: r2(Number(line.quantity) * Number(line.unitCostSnapshot)),
          unit: line.unit,
          warehouseFromId: warehouse.id,
          salesOrderId: order.id,
          createdBy: adminUser!.id,
        },
      });
      mvtCount++;
    }
  }
  console.log(`   ✓ ${mvtCount} stock out movements`);

  // ── STEP 16: Expenses ────────────────────────────────────
  console.log('\n💳  Step 16: Operational expenses');

  const expenseDefs = [
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:12, year:2025 },
    { title:'Électricité & Eau Décembre',     amount:45000,  cat:'CHARGES',        month:12, year:2025 },
    { title:'Carburant véhicule commercial',  amount:28000,  cat:'TRANSPORT',      month:12, year:2025 },
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:1,  year:2026 },
    { title:'Électricité & Eau Janvier',      amount:52000,  cat:'CHARGES',        month:1,  year:2026 },
    { title:'Assurance flotte véhicules',     amount:35000,  cat:'ASSURANCE',      month:1,  year:2026 },
    { title:'Maintenance équipements',        amount:22000,  cat:'MAINTENANCE',    month:2,  year:2026 },
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:2,  year:2026 },
    { title:'Frais déplacement commercial',   amount:15000,  cat:'DEPLACEMENT',    month:2,  year:2026 },
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:3,  year:2026 },
    { title:'Électricité & Eau Mars',         amount:48000,  cat:'CHARGES',        month:3,  year:2026 },
    { title:'Publicité & Marketing',          amount:60000,  cat:'MARKETING',      month:3,  year:2026 },
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:4,  year:2026 },
    { title:'Formation personnel',            amount:40000,  cat:'FORMATION',      month:4,  year:2026 },
    { title:'Fournitures bureau',             amount:12000,  cat:'FOURNITURES',    month:5,  year:2026 },
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:5,  year:2026 },
    { title:'Entretien locaux',               amount:18000,  cat:'MAINTENANCE',    month:5,  year:2026 },
    { title:'Loyer Zone Industrielle Rouïba', amount:180000, cat:'LOYER',          month:6,  year:2026 },
    { title:'Électricité & Eau Juin',         amount:55000,  cat:'CHARGES',        month:6,  year:2026 },
  ];

  for (const e of expenseDefs) {
    await prisma.expense.create({
      data: {
        companyId,
        title: e.title,
        amount: e.amount,
        category: e.cat,
        date: D(e.year, e.month, rand(1,28)),
        paymentMethod: pick([PaymentMethod.TRANSFER, PaymentMethod.CHECK, PaymentMethod.CASH]),
        reference: seqRef('EXP', rand(100, 999)),
      },
    });
  }
  console.log(`   ✓ ${expenseDefs.length} expenses created`);

  // ── STEP 17: Projects ────────────────────────────────────
  console.log('\n📁  Step 17: Projects');

  const projectDefs = [
    { name:'Chantier Grand Alger - Rénovation Façades', status:'ACTIVE',     start:D(2026,1,15),  end:D(2026,6,30),  budget:2500000, client: customers[0] },
    { name:'Appel d\'offres Logements Sociaux Blida',   status:'COMPLETED',  start:D(2025,12,1),  end:D(2026,3,31),  budget:800000,  client: customers[3] },
    { name:'Partenariat Grande Surface Est',             status:'PLANNED',    start:D(2026,7,1),   end:D(2026,12,31), budget:1200000, client: customers[6] },
    { name:'Formation Équipe Commerciale Q2 2026',       status:'COMPLETED',  start:D(2026,4,1),   end:D(2026,4,30),  budget:120000,  client: null },
    { name:'Audit Qualité ISO & Certification',          status:'ACTIVE',     start:D(2026,3,15),  end:D(2026,9,15),  budget:350000,  client: null },
  ];

  for (const p of projectDefs) {
    const proj = await prisma.project.create({
      data: {
        companyId,
        name: p.name,
        code: `PROJ-${rand(1000,9999)}`,
        status: p.status as any,
        startDate: p.start,
        targetEndDate: p.end,
        budget: p.budget,
        currency: 'DZD',
        priority: pick(['LOW','MEDIUM','HIGH']) as any,
        progress: p.status === 'COMPLETED' ? 100 : rand(10,80),
        clientId: p.client?.id ?? null,
        projectManagerId: adminUser!.id,
        createdBy: adminUser!.id,
      },
    });

    // Create some tasks
    const taskTitles = [
      'Réunion de lancement', 'Préparation devis', 'Commande matériaux',
      'Suivi chantier', 'Réception & contrôle qualité', 'Facturation client',
    ];
    for (let t = 0; t < rand(2,4); t++) {
      await prisma.projectTask.create({
        data: {
          taskNumber: `T-${rand(10000,99999)}`,
          title: taskTitles[t % taskTitles.length],
          projectId: proj.id,
          status: pick(['TODO','IN_PROGRESS','DONE']) as any,
          priority: pick(['LOW','MEDIUM','HIGH']) as any,
          assignedToId: pick([adminUser!.id, createdUsers['commercial@cameleoncolors.dz'].id]),
          dueDate: addDays(p.start, rand(7, 60)),
        },
      });
    }
  }
  console.log(`   ✓ ${projectDefs.length} projects + tasks created`);

  // ── STEP 18: Calendar events ─────────────────────────────
  console.log('\n📅  Step 18: Calendar events');

  const calEvents = [
    { title:'Réunion mensuelle équipe commerciale', type:'MEETING', start:D(2026,1,8),  dur:120  },
    { title:'Revue des stocks Q1',                  type:'MEETING', start:D(2026,1,20), dur:90   },
    { title:'Séance formation produits',            type:'MEETING', start:D(2026,2,12), dur:240  },
    { title:'Visite client — Batisseurs du Nord',   type:'MEETING', start:D(2026,2,18), dur:180  },
    { title:'Audit interne qualité',                type:'MEETING', start:D(2026,3,5),  dur:480  },
    { title:'Réunion mensuelle direction',          type:'MEETING', start:D(2026,3,10), dur:120  },
    { title:'Congé — Sofiane Mebarki',              type:'VACATION',start:D(2026,1,15), dur:5760 },
    { title:'Salon Batimatec 2026',                 type:'MEETING', start:D(2026,4,20), dur:1440 },
    { title:'Clôture trimestrielle comptabilité',   type:'DEADLINE',start:D(2026,4,30), dur:60   },
    { title:'Réunion budget H2 2026',               type:'MEETING', start:D(2026,6,15), dur:180  },
  ];

  for (const ev of calEvents) {
    const start = ev.start;
    const end   = addDays(start, 0);
    end.setMinutes(end.getMinutes() + ev.dur);
    await prisma.calendarEvent.create({
      data: {
        companyId,
        title: ev.title,
        eventType: ev.type as any,
        startDatetime: start,
        endDatetime: end,
        organizerId: adminUser!.id,
        createdBy: adminUser!.id,
        status: 'scheduled',
      },
    });
  }
  console.log(`   ✓ ${calEvents.length} calendar events`);

  // ── STEP 19: Audit logs ──────────────────────────────────
  console.log('\n🔒  Step 19: Audit logs');

  const auditEntries = [
    { action:'CREATE', entity:'SalesOrder',   desc:'Création commande client BC-001' },
    { action:'UPDATE', entity:'Invoice',       desc:'Mise à jour statut facture → PAID' },
    { action:'CREATE', entity:'PurchaseOrder', desc:'Nouvelle commande fournisseur AC-001' },
    { action:'CREATE', entity:'Employee',      desc:'Création employé Sofiane Mebarki' },
    { action:'UPDATE', entity:'Product',       desc:'Mise à jour stock PI-001' },
    { action:'CREATE', entity:'Payment',       desc:'Paiement enregistré PAY-001' },
    { action:'UPDATE', entity:'Customer',      desc:'Mise à jour fiche client' },
    { action:'CREATE', entity:'LeaveRequest',  desc:'Demande congé soumise' },
    { action:'UPDATE', entity:'PayrollPeriod', desc:'Période paie clôturée Déc 2025' },
    { action:'CREATE', entity:'Project',       desc:'Nouveau projet créé' },
  ];

  for (const log of auditEntries) {
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: adminUser!.id,
        action: log.action,
        entity: log.entity,
        entityId: companyId, // placeholder
        description: log.desc,
        newValues: { status: 'created' },
      },
    });
  }
  console.log(`   ✓ ${auditEntries.length} audit logs`);

  // ── STEP 20: KPIs ────────────────────────────────────────
  console.log('\n📈  Step 20: Company KPIs');

  const totalSalesRevenue = salesOrders.reduce((s, o) => s + Number(o.totalAmountTtc), 0);
  const totalInvoiced     = invoices.reduce((s, i) => s + Number(i.totalAmountTtc ?? i.totalTTC ?? 0), 0);
  const stockValue        = Object.values(products).reduce((s, p: any) => s + Number(p.stockQuantity) * Number(p.standardCost), 0);

  const kpiDefs = [
    { metric:'total_sales',      value: r2(totalSalesRevenue),  unit:'DZD' },
    { metric:'total_invoiced',   value: r2(totalInvoiced),      unit:'DZD' },
    { metric:'inventory_value',  value: r2(stockValue),         unit:'DZD' },
    { metric:'active_customers', value: customers.length,       unit:'PCS' },
    { metric:'active_suppliers', value: suppliers.length,       unit:'PCS' },
    { metric:'total_employees',  value: Object.keys(employees).length, unit:'PCS' },
    { metric:'pending_invoices', value: invoices.filter(i => i.status === 'SENT').length, unit:'PCS' },
  ];

  for (const kpi of kpiDefs) {
    await prisma.companyKpi.upsert({
      where:  { companyId_metric: { companyId, metric: kpi.metric } },
      update: { value: kpi.value, unit: kpi.unit },
      create: { companyId, metric: kpi.metric, value: kpi.value, unit: kpi.unit },
    });
  }
  console.log(`   ✓ ${kpiDefs.length} KPIs upserted`);

  // ── DONE ─────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('✅  Seed complete!');
  console.log(`   Company  : Cameleon Colors (${companyId})`);
  console.log(`   Login    : ${TARGET_EMAIL}`);
  console.log(`   Password : ${PLAIN_PASSWORD}`);
  console.log('═'.repeat(50) + '\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
