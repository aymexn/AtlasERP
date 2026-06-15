import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

/**
 * Permission-to-route mapping.
 * First matching rule wins. ADMIN role bypasses all checks.
 */
const ROUTE_PERMISSION_MAP: Array<{ pattern: RegExp; key: string }> = [
    { pattern: /\/settings\/users/, key: 'users:user:read' },
    { pattern: /\/settings\/roles/, key: 'roles:role:read' },
    { pattern: /\/settings\/permissions/, key: 'roles:role:read' },
    { pattern: /\/settings\/audit/, key: 'audit:log:read' },
    { pattern: /\/sales\//, key: 'sales:order:read' },
    { pattern: /\/purchases\//, key: 'purchases:order:read' },
    { pattern: /\/hr\/employees/, key: 'hr:employees:read' },
    { pattern: /\/hr\/leaves/, key: 'hr:leaves:read' },
    { pattern: /\/hr\/payroll/, key: 'hr:payroll:read' },
    { pattern: /\/hr\/recruitment/, key: 'hr:recruitment:read' },
    { pattern: /\/hr\/performance/, key: 'hr:performance:read' },
    { pattern: /\/inventory/, key: 'stock:inventory:read' },
    { pattern: /\/manufacturing/, key: 'stock:inventory:read' },
    { pattern: /\/catalogue\/products/, key: 'products:product:read' },
];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Detect double locale segments: /(fr|ar|en)/(fr|ar|en)/...
    const locales = routing.locales;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length >= 2) {
        const first = segments[0];
        const second = segments[1];

        if (locales.includes(first as any) && locales.includes(second as any)) {
            const newPathname = '/' + [first, ...segments.slice(2)].join('/');
            const url = request.nextUrl.clone();
            url.pathname = newPathname;
            return NextResponse.redirect(url);
        }
    }

    // 2. Auth & Tenant Isolation Check
    const isApiRoute = pathname.startsWith('/api');
    const isAuthRoute =
        pathname.startsWith('/api/auth') ||
        pathname.includes('/login') ||
        pathname.includes('/accept-invitation') ||
        pathname.includes('/register');
    const isProtected =
        pathname.includes('/dashboard') ||
        pathname.includes('/admin') ||
        pathname.includes('/purchases') ||
        pathname.includes('/sales') ||
        pathname.includes('/settings') ||
        pathname.includes('/products') ||
        pathname.includes('/catalogue') ||
        pathname.includes('/inventory') ||
        pathname.includes('/manufacturing');

    console.log("[PROXY TRACE] pathname:", pathname, "isApiRoute:", isApiRoute, "isAuthRoute:", isAuthRoute, "isProtected:", isProtected);
    const allCookieNames = request.cookies.getAll().map(c => c.name);
    console.log("[PROXY TRACE] all cookies:", allCookieNames);

    if ((isApiRoute && !isAuthRoute) || (isProtected && !isAuthRoute)) {
        // Check for the custom atlas_token cookie or NextAuth session cookies
        const atlasToken = request.cookies.get('atlas_token')?.value;
        const nextAuthToken = request.cookies.getAll().some(
            c => c.name.startsWith('next-auth.session-token') ||
                 c.name.startsWith('__Secure-next-auth.session-token') ||
                 c.name.startsWith('authjs.session-token') ||
                 c.name.startsWith('__Secure-authjs.session-token')
        );

        console.log("[PROXY TRACE] tokens found:", { atlasToken: !!atlasToken, nextAuthToken: !!nextAuthToken });

        if (!atlasToken && !nextAuthToken) {
            console.log("[PROXY TRACE] redirecting/blocking due to missing tokens");
            if (isApiRoute) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            } else {
                const locale = locales.includes(segments[0] as any) ? segments[0] : 'fr';
                const loginUrl = new URL(`/${locale}/login`, request.url);
                return NextResponse.redirect(loginUrl);
            }
        } else if (atlasToken) {
            // Decode token to extract role & permissions — enforce RBAC restrictions
            try {
                const base64Payload = atlasToken.split('.')[1];
                if (base64Payload) {
                    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = atob(base64);
                    const payload = JSON.parse(jsonPayload);

                    const userRole = payload.role as string;
                    const userPermissions: string[] = Array.isArray(payload.permissions)
                        ? payload.permissions
                        : [];
                    const locale = locales.includes(segments[0] as any) ? segments[0] : 'fr';

                    // ADMIN enum role bypasses all permission checks
                    const isSystemAdmin = userRole === 'ADMIN';

                    if (!isSystemAdmin) {
                        for (const rule of ROUTE_PERMISSION_MAP) {
                            if (rule.pattern.test(pathname)) {
                                if (!userPermissions.includes(rule.key)) {
                                    // Redirect pages to dashboard; reject API calls with 403
                                    if (isApiRoute) {
                                        return NextResponse.json(
                                            { error: `Accès refusé : ${rule.key}`, code: 'PERMISSION_DENIED' },
                                            { status: 403 }
                                        );
                                    }
                                    return NextResponse.redirect(
                                        new URL(`/${locale}/dashboard`, request.url)
                                    );
                                }
                                break; // first matching rule wins
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Middleware token verification error:', error);
            }
        }
    }

    // Bypass next-intl for API routes
    if (isApiRoute) {
        return NextResponse.next();
    }

    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for static files
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',],
};
