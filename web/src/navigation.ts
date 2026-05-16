import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['fr', 'en', 'ar'],
    defaultLocale: 'fr',
    localePrefix: 'always',
    pathnames: {
        '/': '/',
        '/dashboard': '/dashboard',
        '/products': '/products',
        '/product-families': '/product-families',
        '/inventory': '/inventory',
        '/inventory/movements': '/inventory/movements',
        '/inventory/products-stock': '/inventory/products-stock',
        '/manufacturing': '/manufacturing',
        '/manufacturing/orders': '/manufacturing/orders',
        '/purchases/orders': '/purchases/orders',
        '/purchases/suppliers': '/purchases/suppliers',
        '/purchases/receptions': '/purchases/receptions',
        '/sales/customers': '/sales/customers',
        '/sales/customers/[id]': '/sales/customers/[id]',
        '/sales/orders': '/sales/orders',
        '/sales/orders/new': '/sales/orders/new',
        '/sales/orders/[id]': '/sales/orders/[id]',
        '/invoices': '/invoices',
        '/invoices/new': '/invoices/new',
        '/sales/payments': '/sales/payments',
        '/expenses': '/expenses',
        '/settings': '/settings',
        '/settings/users': '/settings/users',
        '/settings/roles': '/settings/roles',
        '/settings/audit': '/settings/audit',
        '/hr/employees': '/hr/employees',
        '/hr/leaves': '/hr/leaves',
        '/hr/payroll': '/hr/payroll',
        '/hr/recruitment': '/hr/recruitment',
        '/hr/performance': '/hr/performance',
        '/login': '/login',
        '/register': '/register',
        '/tenant': '/tenant',
        '/treasury/aged-receivables': '/treasury/aged-receivables',
        '/treasury/forecast': '/treasury/forecast',
        '/analytics': '/analytics',
        '/analytics/abc': '/analytics/abc',
        '/analytics/dead-stock': '/analytics/dead-stock'
    }
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

// Re-export constants for backward compatibility if needed in middleware/etc.
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
