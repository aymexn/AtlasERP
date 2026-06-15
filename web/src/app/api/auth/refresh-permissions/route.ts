import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/refresh-permissions
 *
 * Proxies to the NestJS backend's POST /auth/refresh-permissions endpoint.
 * The backend re-fetches the user's current permissions from the DB and
 * returns a new JWT with an updated permissions[] array.
 *
 * This route then re-sets the atlas_token cookie with the new JWT so that:
 * - proxy.ts middleware immediately enforces the updated permissions
 * - requirePermission() helper uses the new permissions on next request
 *
 * The frontend PermissionContext.invalidateAndRefresh() also syncs localStorage.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('atlas_token')?.value;

    if (!currentToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const BACKEND_URL =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3000';

    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh-permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendRes.ok) {
      const errBody = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody.message || 'Erreur backend lors du rafraîchissement' },
        { status: backendRes.status }
      );
    }

    const { access_token } = await backendRes.json();

    // Re-set the atlas_token cookie with the new JWT
    const response = NextResponse.json({ success: true });
    response.cookies.set('atlas_token', access_token, {
      httpOnly: false, // Must be readable by JS (apiFetch reads it from document.cookie)
      sameSite: 'lax',
      maxAge: 86400, // 24h — matches original login cookie
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('[REFRESH_PERMISSIONS]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors du rafraîchissement' },
      { status: 500 }
    );
  }
}
