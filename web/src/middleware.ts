import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Detect double locale segments: /(fr|ar|en)/(fr|ar|en)/...
    // We match /locale/locale/rest
    const locales = routing.locales;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length >= 2) {
        const first = segments[0];
        const second = segments[1];

        if (locales.includes(first as any) && locales.includes(second as any)) {
            // Found double locale. Keep the FIRST one and remove the second.
            const newPathname = '/' + [first, ...segments.slice(2)].join('/');
            const url = request.nextUrl.clone();
            url.pathname = newPathname;
            return NextResponse.redirect(url);
        }
    }

    // 2. Handle non-localized root aliases (already handled by next-intl mostly, 
    // but the alias pages I added in src/app/login/page.tsx will handle the actual render/redirect if they aren't matched here)

    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
