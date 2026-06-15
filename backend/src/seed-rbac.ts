import { PrismaClient, MovementType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRbac(client?: PrismaClient): Promise<void> {
  const db = client ?? prisma;
  console.log('🔐 Seeding RBAC System...');

  // 1. Permissions Definition
  const permissions = [
    // Client Management
    { module: 'clients', resource: 'client', action: 'create', description: 'Create new clients' },
    { module: 'clients', resource: 'client', action: 'read', description: 'View client information' },
    { module: 'clients', resource: 'client', action: 'update', description: 'Update client information' },
    { module: 'clients', resource: 'client', action: 'delete', description: 'Delete clients' },
    { module: 'clients', resource: 'client', action: 'export', description: 'Export client data' },
    { module: 'clients', resource: 'client', action: 'import', description: 'Import client data' },
    
    // Supplier Management
    { module: 'suppliers', resource: 'supplier', action: 'create', description: 'Create new suppliers' },
    { module: 'suppliers', resource: 'supplier', action: 'read', description: 'View supplier information' },
    { module: 'suppliers', resource: 'supplier', action: 'update', description: 'Update supplier information' },
    { module: 'suppliers', resource: 'supplier', action: 'delete', description: 'Delete suppliers' },
    { module: 'suppliers', resource: 'supplier', action: 'export', description: 'Export supplier data' },
    
    // Product Management
    { module: 'products', resource: 'product', action: 'create', description: 'Create new products' },
    { module: 'products', resource: 'product', action: 'read', description: 'View product information' },
    { module: 'products', resource: 'product', action: 'update', description: 'Update product information' },
    { module: 'products', resource: 'product', action: 'delete', description: 'Delete products' },
    { module: 'products', resource: 'product', action: 'export', description: 'Export product data' },
    { module: 'products', resource: 'product', action: 'import', description: 'Import product data' },
    
    // Stock Management
    { module: 'stock', resource: 'inventory', action: 'create', description: 'Create stock entries' },
    { module: 'stock', resource: 'inventory', action: 'read', description: 'View inventory' },
    { module: 'stock', resource: 'inventory', action: 'update', description: 'Update stock levels' },
    { module: 'stock', resource: 'inventory', action: 'delete', description: 'Delete stock entries' },
    { module: 'stock', resource: 'inventory', action: 'adjust', description: 'Adjust stock quantities' },
    { module: 'stock', resource: 'inventory', action: 'transfer', description: 'Transfer stock between warehouses' },
    { module: 'stock', resource: 'inventory', action: 'audit', description: 'Perform stock audits' },
    { module: 'stock', resource: 'inventory', action: 'export', description: 'Export stock data' },
    
    // Sales Management
    { module: 'sales', resource: 'order', action: 'create', description: 'Create sales orders' },
    { module: 'sales', resource: 'order', action: 'read', description: 'View sales orders' },
    { module: 'sales', resource: 'order', action: 'update', description: 'Update sales orders' },
    { module: 'sales', resource: 'order', action: 'delete', description: 'Delete sales orders' },
    { module: 'sales', resource: 'order', action: 'approve', description: 'Approve sales orders' },
    { module: 'sales', resource: 'order', action: 'cancel', description: 'Cancel sales orders' },
    { module: 'sales', resource: 'order', action: 'prepare', description: 'Prepare orders for shipping' },
    { module: 'sales', resource: 'order', action: 'ship', description: 'Mark orders as shipped' },
    { module: 'sales', resource: 'order', action: 'export', description: 'Export sales data' },
    
    // Purchase Management
    { module: 'purchases', resource: 'order', action: 'create', description: 'Create purchase orders' },
    { module: 'purchases', resource: 'order', action: 'read', description: 'View purchase orders' },
    { module: 'purchases', resource: 'order', action: 'update', description: 'Update purchase orders' },
    { module: 'purchases', resource: 'order', action: 'delete', description: 'Delete purchase orders' },
    { module: 'purchases', resource: 'order', action: 'approve', description: 'Approve purchase orders' },
    { module: 'purchases', resource: 'order', action: 'receive', description: 'Receive purchased goods' },
    { module: 'purchases', resource: 'order', action: 'export', description: 'Export purchase data' },
    
    // Finance Management
    { module: 'finance', resource: 'transaction', action: 'create', description: 'Create financial transactions' },
    { module: 'finance', resource: 'transaction', action: 'read', description: 'View financial transactions' },
    { module: 'finance', resource: 'transaction', action: 'update', description: 'Update financial transactions' },
    { module: 'finance', resource: 'transaction', action: 'delete', description: 'Delete financial transactions' },
    { module: 'finance', resource: 'transaction', action: 'approve', description: 'Approve financial transactions' },
    { module: 'finance', resource: 'transaction', action: 'reconcile', description: 'Reconcile accounts' },
    { module: 'finance', resource: 'transaction', action: 'export', description: 'Export financial data' },
    
    // HR Management
    { module: 'hr', resource: 'employees', action: 'create', description: 'Create employee records' },
    { module: 'hr', resource: 'employees', action: 'read', description: 'View employee information' },
    { module: 'hr', resource: 'employees', action: 'update', description: 'Update employee information' },
    { module: 'hr', resource: 'employees', action: 'delete', description: 'Delete employee records' },
    { module: 'hr', resource: 'employees', action: 'approve', description: 'Approve HR requests' },
    { module: 'hr', resource: 'employees', action: 'export', description: 'Export HR data' },

    { module: 'hr', resource: 'leaves', action: 'create', description: 'Create leave requests' },
    { module: 'hr', resource: 'leaves', action: 'read', description: 'View leave requests' },
    { module: 'hr', resource: 'leaves', action: 'manage', description: 'Manage leave requests' },
    { module: 'hr', resource: 'leaves', action: 'approve', description: 'Approve leave requests' },

    { module: 'hr', resource: 'payroll', action: 'create', description: 'Create payroll runs' },
    { module: 'hr', resource: 'payroll', action: 'read', description: 'View payroll runs' },
    { module: 'hr', resource: 'payroll', action: 'approve', description: 'Approve payroll runs' },

    { module: 'hr', resource: 'recruitment', action: 'create', description: 'Create recruitment postings' },
    { module: 'hr', resource: 'recruitment', action: 'read', description: 'View recruitment postings' },
    { module: 'hr', resource: 'recruitment', action: 'update', description: 'Update recruitment postings' },
    { module: 'hr', resource: 'recruitment', action: 'manage', description: 'Manage recruitment postings' },

    { module: 'hr', resource: 'performance', action: 'create', description: 'Create performance evaluations' },
    { module: 'hr', resource: 'performance', action: 'read', description: 'View performance evaluations' },
    { module: 'hr', resource: 'performance', action: 'update', description: 'Update performance evaluations' },
    { module: 'hr', resource: 'performance', action: 'manage', description: 'Manage performance evaluations' },
    
    // Reports
    { module: 'reports', resource: 'report', action: 'create', description: 'Create custom reports' },
    { module: 'reports', resource: 'report', action: 'read', description: 'View reports' },
    { module: 'reports', resource: 'report', action: 'export', description: 'Export reports' },
    { module: 'reports', resource: 'report', action: 'schedule', description: 'Schedule automated reports' },
    
    // Settings
    { module: 'settings', resource: 'config', action: 'create', description: 'Create settings' },
    { module: 'settings', resource: 'config', action: 'read', description: 'View settings' },
    { module: 'settings', resource: 'config', action: 'update', description: 'Update settings' },
    { module: 'settings', resource: 'config', action: 'delete', description: 'Delete settings' },
    
    // User Management
    { module: 'users', resource: 'user', action: 'create', description: 'Create users' },
    { module: 'users', resource: 'user', action: 'read', description: 'View users' },
    { module: 'users', resource: 'user', action: 'update', description: 'Update users' },
    { module: 'users', resource: 'user', action: 'delete', description: 'Delete users' },
    { module: 'users', resource: 'user', action: 'assign_roles', description: 'Assign roles to users' },
    
    // Role Management
    { module: 'roles', resource: 'role', action: 'create', description: 'Create roles' },
    { module: 'roles', resource: 'role', action: 'read', description: 'View roles' },
    { module: 'roles', resource: 'role', action: 'update', description: 'Update roles' },
    { module: 'roles', resource: 'role', action: 'delete', description: 'Delete roles' },
    { module: 'roles', resource: 'role', action: 'assign_permissions', description: 'Assign permissions to roles' },
    
    // Audit
    { module: 'audit', resource: 'log', action: 'read', description: 'View audit logs' },
    { module: 'audit', resource: 'log', action: 'export', description: 'Export audit logs' }
  ];

  console.log('  -> Upserting permissions...');
  for (const perm of permissions) {
    await db.appPermission.upsert({
      where: {
        module_resource_action: {
          module: perm.module,
          resource: perm.resource,
          action: perm.action,
        }
      },
      update: { description: perm.description },
      create: perm,
    });
  }

  // 2. Roles Definition
  const roles = [
    { name: 'admin', displayName: 'Administrateur', description: 'Full system access', isSystemRole: true },
    { name: 'manager', displayName: 'Manager', description: 'Department management access', isSystemRole: true },
    { name: 'commercial', displayName: 'Commercial', description: 'Sales and customer management', isSystemRole: true },
    { name: 'magasinier', displayName: 'Responsable Dépôt', description: 'Inventory and stock management', isSystemRole: true },
    { name: 'accountant', displayName: 'Comptable', description: 'Financial and accounting access', isSystemRole: true },
    { name: 'hr_manager', displayName: 'Responsable RH', description: 'Full HR module management', isSystemRole: true },
  ];

  console.log('  -> Upserting roles...');
  const roleMap: Record<string, any> = {};
  for (const role of roles) {
    const createdRole = await db.appRole.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName, description: role.description },
      create: role,
    });
    roleMap[role.name] = createdRole;
  }

  // 3. Role Permissions Assignment
  console.log('  -> Assigning permissions to roles...');

  const allPerms = await db.appPermission.findMany();

  // Filter by module + optional resource + actions
  const getPermIds = (module: string, resourceOrActions: string | string[], actions?: string[]) => {
    if (Array.isArray(resourceOrActions)) {
      // Called as getPermIds(module, actions[]) — no resource filter
      return allPerms
        .filter(p => p.module === module && resourceOrActions.includes(p.action))
        .map(p => p.id);
    }
    // Called as getPermIds(module, resource, actions[]) — filter by resource too
    return allPerms
      .filter(p => p.module === module && p.resource === resourceOrActions && (actions ?? []).includes(p.action))
      .map(p => p.id);
  };

  // ADMIN: ALL
  const adminPermIds = allPerms.map(p => p.id);
  await assignPermissions(roleMap['admin'].id, adminPermIds);

  // MANAGER
  const managerPerms = [
    ...getPermIds('clients', ['create', 'read', 'update', 'export']),
    ...getPermIds('suppliers', ['read', 'export']),
    ...getPermIds('products', ['create', 'read', 'update', 'export']),
    ...getPermIds('stock', ['read', 'adjust', 'transfer', 'export']),
    ...getPermIds('sales', ['create', 'read', 'update', 'approve', 'export']),
    ...getPermIds('purchases', ['create', 'read', 'approve', 'export']),
    ...getPermIds('finance', ['read', 'export']),
    ...getPermIds('hr', ['read', 'approve', 'export']),
    ...getPermIds('reports', ['read', 'export']),
    ...getPermIds('settings', ['read']),
    ...getPermIds('users', ['read']),
    ...getPermIds('audit', ['read']),
  ];
  await assignPermissions(roleMap['manager'].id, managerPerms);

  // COMMERCIAL
  const commercialPerms = [
    ...getPermIds('clients', ['create', 'read', 'update', 'export']),
    ...getPermIds('suppliers', ['read']),
    ...getPermIds('products', ['read', 'export']),
    ...getPermIds('stock', ['read']),
    ...getPermIds('sales', ['create', 'read', 'update', 'export']),
    ...getPermIds('purchases', ['read']),
    ...getPermIds('finance', ['read']),
    ...getPermIds('reports', ['read']),
    ...getPermIds('settings', ['read']),
  ];
  await assignPermissions(roleMap['commercial'].id, commercialPerms);

  // MAGASINIER
  const magasinierPerms = [
    ...getPermIds('products', ['create', 'read', 'update', 'export']),
    ...getPermIds('stock', ['create', 'read', 'update', 'adjust', 'transfer', 'audit', 'export']),
    ...getPermIds('purchases', ['read', 'receive']),
    ...getPermIds('sales', ['read', 'prepare', 'ship']),
    ...getPermIds('suppliers', ['read']),
    ...getPermIds('reports', ['read']),
    ...getPermIds('settings', ['read']),
  ];
  await assignPermissions(roleMap['magasinier'].id, magasinierPerms);

  // ACCOUNTANT
  const accountantPerms = [
    ...getPermIds('clients', ['read', 'export']),
    ...getPermIds('suppliers', ['read', 'export']),
    ...getPermIds('sales', ['read', 'export']),
    ...getPermIds('purchases', ['read', 'export']),
    ...getPermIds('finance', ['create', 'read', 'update', 'approve', 'reconcile', 'export']),
    ...getPermIds('reports', ['read', 'export']),
    ...getPermIds('settings', ['read']),
  ];
  await assignPermissions(roleMap['accountant'].id, accountantPerms);

  // HR MANAGER — full HR module access
  const hrManagerPerms = [
    ...getPermIds('hr', 'employees', ['create', 'read', 'update', 'delete', 'approve', 'export']),
    ...getPermIds('hr', 'leaves',    ['create', 'read', 'manage', 'approve']),
    ...getPermIds('hr', 'payroll',   ['create', 'read', 'approve']),
    ...getPermIds('hr', 'recruitment', ['create', 'read', 'update', 'manage']),
    ...getPermIds('hr', 'performance', ['create', 'read', 'update', 'manage']),
    ...getPermIds('reports', ['read', 'export']),
    ...getPermIds('settings', ['read']),
  ];
  await assignPermissions(roleMap['hr_manager'].id, hrManagerPerms);

  // 4. Assign Admin Role to first user
  const firstUser = await db.user.findFirst();
  if (firstUser) {
    console.log(`  -> Assigning admin role to user: ${firstUser.email}`);
    await db.userRole.upsert({
      where: {
        userId_roleId: {
          userId: firstUser.id,
          roleId: roleMap['admin'].id,
        }
      },
      update: { isActive: true },
      create: {
        userId: firstUser.id,
        roleId: roleMap['admin'].id,
        isActive: true,
      }
    });
  }

  console.log('✅ RBAC Seeding Complete.');
}

async function assignPermissions(roleId: string, permissionIds: string[], db: PrismaClient = prisma) {
  for (const permId of permissionIds) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permId,
        }
      },
      update: {},
      create: {
        roleId,
        permissionId: permId,
      }
    });
  }
}

// Standalone CLI usage
if (require.main === module) {
  seedRbac()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

