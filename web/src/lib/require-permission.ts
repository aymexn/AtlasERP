import { headers, cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface AtlasTokenPayload {
  sub: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[]; // ["clients:client:read", "sales:order:create", ...]
  exp: number;
  iat: number;
}

/** Decode atlas_token payload without any DB call (pure base64 decode) */
function decodeAtlasToken(token: string): AtlasTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Normalize base64url → base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    // Reject expired tokens
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload as AtlasTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract and decode atlas_token from:
 * 1. Authorization: Bearer <token> header
 * 2. atlas_token cookie (fallback)
 */
export async function getAtlasPayload(): Promise<AtlasTokenPayload | null> {
  const headerList = await headers();
  const authHeader = headerList.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('atlas_token')?.value ?? null;
  }

  if (!token) return null;
  return decodeAtlasToken(token);
}

/**
 * Permission guard for Next.js API route handlers.
 * Returns null if access is GRANTED (caller should continue).
 * Returns NextResponse(403) if access is DENIED.
 *
 * @example
 *   export async function GET(request: Request) {
 *     const denied = await requirePermission('clients', 'client', 'read', request);
 *     if (denied) return denied;
 *     // ... continue with handler ...
 *   }
 */
export async function requirePermission(
  module: string,
  resource: string,
  action: string,
  request?: Request
): Promise<NextResponse | null> {
  const payload = await getAtlasPayload();

  // No valid token at all → 401
  if (!payload) {
    return NextResponse.json(
      { error: 'Non authentifié — veuillez vous connecter' },
      { status: 401 }
    );
  }

  // System ADMIN enum role always passes — no permission check needed
  if (payload.role === 'ADMIN') return null;

  const requiredKey = `${module}:${resource}:${action}`;
  const hasPermission =
    Array.isArray(payload.permissions) && payload.permissions.includes(requiredKey);

  if (!hasPermission) {
    // Fire-and-forget audit log — never await, never block the 403 response
    const ip =
      request?.headers.get('x-forwarded-for') ??
      request?.headers.get('x-real-ip') ??
      'unknown';
    const ua = request?.headers.get('user-agent') ?? '';

    prisma.permissionAuditLog
      .create({
        data: {
          userId: payload.sub,
          actionType: 'access_denied',
          resourceType: `${module}:${resource}`,
          details: { action, requiredKey, ip, ua },
          ipAddress: ip,
          userAgent: ua,
        },
      })
      .catch(() => {}); // silent — DB audit failure must never crash the API

    return NextResponse.json(
      {
        error: `Accès refusé : permission manquante (${requiredKey})`,
        code: 'PERMISSION_DENIED',
        required: requiredKey,
      },
      { status: 403 }
    );
  }

  return null; // ← null = access granted, caller should continue
}
