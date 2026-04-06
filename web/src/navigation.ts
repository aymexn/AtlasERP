import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['fr', 'ar', 'en'],
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
        '/sales/orders': '/sales/orders',
        '/sales/invoices': '/sales/invoices',
        '/sales/payments': '/sales/payments',
        '/finances/expenses': '/finances/expenses',
        '/login': '/login',
        '/register': '/register',
        '/tenant': '/tenant'
    }
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

// Re-export constants for backward compatibility if needed in middleware/etc.
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
