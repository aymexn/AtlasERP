async function run() {
    try {
        const suffix = Date.now();
        const companyEmail = `company_${suffix}@test.com`;
        const adminEmail = `admin_${suffix}@test.com`;
        const employeeEmail = `ali_${suffix}@test.com`;

        console.log(`📝 Registering a new admin user (${adminEmail})...`);
        const regPayload = {
            company: {
                name: `SARL Test Company ${suffix}`,
                nif: "987654321098765",
                rc: "98/76-5432109B85",
                nis: "987654321098765",
                ai: "987655",
                email: companyEmail,
                phone: "+213555555555"
            },
            admin: {
                name: "Admin Test",
                email: adminEmail,
                password: "password123"
            }
        };
        const regRes = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });
        const regData = await regRes.json();
        console.log('Registration Status:', regRes.status);
        if (!regRes.ok) {
            console.error('Registration failed:', regData);
            return;
        }

        console.log('🔑 Testing auth/login...');
        const authRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: 'password123' })
        });
        const authData = await authRes.json();
        console.log('Login Status:', authRes.status);
        if (!authRes.ok) {
            console.error('Login failed:', authData);
            return;
        }
        const token = authData.access_token;
        console.log('JWT Token acquired successfully');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 1. Get Employees List
        console.log('\n👥 Fetching employees...');
        const empListRes = await fetch('http://localhost:3000/hr/employees', { headers });
        console.log('Employees list status:', empListRes.status);
        const emps = await empListRes.json();
        console.log('Employees found:', emps.length);

        // 2. Create Employee
        console.log('\n➕ Creating an employee...');
        const newEmpRes = await fetch('http://localhost:3000/hr/employees', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                firstName: 'Ali',
                lastName: 'Benali',
                email: employeeEmail,
                phone: '+213555123456',
                position: 'Développeur Full-Stack',
                department: 'Ingénierie',
                hireDate: '2026-06-01',
                employmentType: 'full_time',
                baseSalary: 120000,
                gender: 'M',
                nationality: 'Algérienne',
                address: '12 rue Didouche Mourad',
                city: 'Alger',
                contract: {
                    contractType: 'CDI',
                    startDate: '2026-06-01',
                    workingHoursPerWeek: 40,
                    salaryBaseAmount: 120000
                }
            })
        });
        console.log('Create employee status:', newEmpRes.status);
        const createdEmp = await newEmpRes.json();
        if (newEmpRes.ok) {
            console.log('Employee created successfully. ID:', createdEmp.id);
        } else {
            console.error('Failed to create employee:', createdEmp);
            return;
        }

        // 3. Get Employees List again
        const empList2Res = await fetch('http://localhost:3000/hr/employees', { headers });
        const emps2 = await empList2Res.json();
        console.log('Updated employees count:', emps2.length);

        // 4. Create Leave Type
        console.log('\n🏖️ Creating a Leave Type...');
        const leaveTypeRes = await fetch('http://localhost:3000/hr/leaves/types', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Congé Annuel',
                code: 'ANNUAL_' + suffix,
                isPaid: true,
                accrualRate: 2.5
            })
        });
        console.log('Create leave type status:', leaveTypeRes.status);
        const createdLeaveType = await leaveTypeRes.json();
        console.log('Leave type ID:', createdLeaveType.id);

        // 5. Initialize Leave Balance for Ali Benali
        console.log('\n⚖️ Creating Leave Balance for Ali Benali...');
        const initBalanceRes = await fetch(`http://localhost:3000/hr/leaves/balance/${createdEmp.id}`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                leaveTypeId: createdLeaveType.id,
                periodYear: 2026,
                totalEntitled: 30,
                usedDays: 0,
                pendingDays: 0
            })
        });
        console.log('Initialize balance status:', initBalanceRes.status);
        const initBalanceData = await initBalanceRes.json();
        console.log('Initialize balance result:', initBalanceData);

        // 6. Request Leave
        console.log('\n📅 Submitting leave request...');
        const reqLeaveRes = await fetch('http://localhost:3000/hr/leaves/requests', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                employeeId: createdEmp.id,
                leaveTypeId: createdLeaveType.id,
                startDate: '2026-07-01',
                endDate: '2026-07-05',
                reason: 'Vacances d\'été'
            })
        });
        console.log('Request leave status:', reqLeaveRes.status);
        const createdRequest = await reqLeaveRes.json();
        console.log('Leave request result:', createdRequest);

        // 7. Create Project
        console.log('\n🏗️ Creating a project...');
        const newProjRes = await fetch('http://localhost:3000/projects', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Projet Atlas ERP V2',
                code: 'PRJ_' + suffix,
                description: 'Refonte de la plateforme ERP multi-tenant',
                priority: 'HIGH'
            })
        });
        console.log('Create project status:', newProjRes.status);
        const createdProj = await newProjRes.json();
        console.log('Project ID:', createdProj.id);

        // 8. Create Calendar Event
        console.log('\n📅 Creating a calendar event...');
        const newEventRes = await fetch('http://localhost:3000/calendar/events', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Réunion de lancement',
                description: 'Lancement du sprint 1 pour le Projet Atlas V2',
                startDatetime: '2026-06-15T09:00:00Z',
                endDatetime: '2026-06-15T10:30:00Z',
                color: '#3b82f6'
            })
        });
        console.log('Create calendar event status:', newEventRes.status);
        const createdEvent = await newEventRes.json();
        console.log('Calendar event ID:', createdEvent.id);

        // 9. Fetch notifications count
        console.log('\n🔔 Fetching notifications...');
        const notifRes = await fetch('http://localhost:3000/collaboration/notifications/unread-count', { headers });
        console.log('Unread notifications count status:', notifRes.status);
        console.log('Unread count:', await notifRes.json());

        // 10. Test Payroll Flow
        console.log('\n💰 Testing Payroll Flow...');
        console.log('Creating a Payroll Period...');
        const periodRes = await fetch('http://localhost:3000/hr/payroll/periods', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                periodStart: '2026-06-01',
                periodEnd: '2026-06-30',
                paymentDate: '2026-06-28',
                periodName: 'Juin 2026'
            })
        });
        console.log('Create period status:', periodRes.status);
        const period = await periodRes.json();
        console.log('Period ID:', period.id);

        console.log('Calculating payroll run...');
        const calcRes = await fetch(`http://localhost:3000/hr/payroll/periods/${period.id}/calculate`, {
            method: 'POST',
            headers
        });
        console.log('Calculate payroll status:', calcRes.status);
        const runs = await calcRes.json();
        console.log('Calculated payroll runs count:', runs.length);
        const firstRunId = runs[0]?.id;
        console.log('First Payroll Run ID:', firstRunId);

        if (firstRunId) {
            console.log('Generating payslip for run:', firstRunId);
            const payslipRes = await fetch(`http://localhost:3000/hr/payroll/runs/${firstRunId}/payslip`, {
                method: 'POST',
                headers
            });
            console.log('Generate payslip status:', payslipRes.status);
            const payslip = await payslipRes.json();
            console.log('Generated payslip path:', payslip.filePath);

            console.log('Fetching employee payslips...');
            const payslipsRes = await fetch(`http://localhost:3000/hr/payroll/employees/${createdEmp.id}/payslips`, { headers });
            console.log('Fetch payslips status:', payslipsRes.status);
            const payslips = await payslipsRes.json();
            console.log('Total payslips found:', payslips.length);
        }

        // 11. Test Recruitment Flow
        console.log('\n💼 Testing Recruitment Flow...');
        console.log('Creating a Job Posting...');
        const jobRes = await fetch('http://localhost:3000/hr/recruitment/jobs', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Product Manager',
                description: 'We are looking for a product manager',
                department: 'Product',
                status: 'OPEN'
            })
        });
        console.log('Create job posting status:', jobRes.status);
        const job = await jobRes.json();
        console.log('Job Posting ID:', job.id);

        console.log('Creating a Candidate...');
        const candidateRes = await fetch('http://localhost:3000/hr/recruitment/candidates', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                firstName: 'Karim',
                lastName: 'Brahimi',
                email: `karim_${suffix}@test.com`,
                phone: '+213550112233'
            })
        });
        console.log('Create candidate status:', candidateRes.status);
        const candidate = await candidateRes.json();
        console.log('Candidate ID:', candidate.id);

        console.log('Submitting application...');
        const appRes = await fetch('http://localhost:3000/hr/recruitment/applications', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                jobPostingId: job.id,
                candidateId: candidate.id,
                notes: 'Excellente candidature'
            })
        });
        console.log('Submit application status:', appRes.status);
        const application = await appRes.json();
        console.log('Application ID:', application.id);

        console.log('Moving application to INTERVIEW stage...');
        const stageRes = await fetch(`http://localhost:3000/hr/recruitment/applications/${application.id}/stage`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ stage: 'INTERVIEW' })
        });
        console.log('Move stage status:', stageRes.status);

        console.log('Hiring candidate...');
        const hireRes = await fetch(`http://localhost:3000/hr/recruitment/applications/${application.id}/hire`, {
            method: 'POST',
            headers
        });
        console.log('Hire candidate status:', hireRes.status);
        const newEmployee = await hireRes.json();
        console.log('New Employee Created via Hire. ID:', newEmployee.id);

    } catch (error) {
        console.error('Test error:', error);
    }
}

run();
