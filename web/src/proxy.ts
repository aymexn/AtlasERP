import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

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
    const isAuthRoute = pathname.startsWith('/api/auth') || pathname.includes('/login') || pathname.includes('/accept-invitation') || pathname.includes('/register');
    const isProtected = pathname.includes('/dashboard') || 
                        pathname.includes('/admin') ||
                        pathname.includes('/purchases') ||
                        pathname.includes('/sales') ||
                        pathname.includes('/settings') ||
                        pathname.includes('/products') ||
                        pathname.includes('/catalogue') ||
                        pathname.includes('/inventory') ||
                        pathname.includes('/manufacturing');
  
    if ((isApiRoute && !isAuthRoute) || (isProtected && !isAuthRoute)) {
        // Check for the custom atlas_token cookie (the app uses its own JWT, not NextAuth session)
        const atlasToken = request.cookies.get('atlas_token')?.value;
        
        if (!atlasToken) {
            if (isApiRoute) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            } else {
                const locale = locales.includes(segments[0] as any) ? segments[0] : 'fr';
                const loginUrl = new URL(`/${locale}/login`, request.url);
                return NextResponse.redirect(loginUrl);
            }
        } else {
            // Decode token to extract role & enforce RBAC restrictions
            try {
                const base64Payload = atlasToken.split('.')[1];
                if (base64Payload) {
                    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = atob(base64);
                    const payload = JSON.parse(jsonPayload);
                    const userRole = payload.role as string;
                    
                    const locale = locales.includes(segments[0] as any) ? segments[0] : 'fr';

                    // --- Logique de restriction par rôle ---
                    // Routes ADMIN seulement
                    if (pathname.includes('/admin') && userRole !== 'ADMIN') {
                        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
                    }

                    // Routes MANAGER seulement (inclut aussi ADMIN)
                    if (pathname.includes('/manager') && !['ADMIN', 'MANAGER'].includes(userRole)) {
                        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
                    }

                    // Routes COMMERCIAL seulement
                    if (pathname.includes('/sales') && !['ADMIN', 'MANAGER', 'COMMERCIAL'].includes(userRole)) {
                        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
                    }

                    // Routes ACCOUNTANT seulement
                    if (pathname.includes('/finance') && !['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(userRole)) {
                        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
                    }

                    // Routes WAREHOUSE_MANAGER / inventory / manufacturing
                    if ((pathname.includes('/inventory') || pathname.includes('/manufacturing')) && 
                        !['ADMIN', 'MANAGER', 'WAREHOUSE_MANAGER', 'MAGASINIER'].includes(userRole)) {
                        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
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
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
