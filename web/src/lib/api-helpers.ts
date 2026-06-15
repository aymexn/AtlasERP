import { headers, cookies } from 'next/headers';
import { auth } from '@/auth';

/**
 * Extracts the tenant (company) ID from the Authorization header JWT, atlas_token cookie,
 * or falls back to the NextAuth session token.
 */
export async function getTenantId(): Promise<string | null> {
    try {
        const headerList = await headers();
        const authHeader = headerList.get('authorization');
        let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get('atlas_token')?.value || null;
        }

        if (token) {
            const base64Payload = token.split('.')[1];
            if (!base64Payload) return null;
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            if (payload.companyId) return payload.companyId;
        }

        // ── Fallback: NextAuth session ────────────────────────────────────────
        // Users authenticated via NextAuth credentials provider won't have an
        // atlas_token, but their companyId is embedded in the NextAuth JWT.
        try {
            const session = await auth();
            const companyId = (session?.user as any)?.companyId;
            if (companyId) return companyId;
        } catch {
            // auth() can throw outside of request context — safe to ignore
        }

        return null;
    } catch (error) {
        console.error('Error extracting tenant ID:', error);
        return null;
    }
}

export async function getUserId(): Promise<string | null> {
    try {
        const headerList = await headers();
        const authHeader = headerList.get('authorization');
        let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get('atlas_token')?.value || null;
        }

        if (token) {
            const base64Payload = token.split('.')[1];
            if (!base64Payload) return null;
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            if (payload.sub) return payload.sub;
        }

        // ── Fallback: NextAuth session ────────────────────────────────────────
        try {
            const session = await auth();
            const userId = session?.user?.id;
            if (userId) return userId;
        } catch {
            // auth() can throw outside of request context — safe to ignore
        }

        return null;
    } catch (error) {
        console.error('Error extracting user ID:', error);
        return null;
    }
}

import { Role } from '@prisma/client';
export function mapAppRoleToEnumRole(roleName: string): Role {
    const normalized = roleName.trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'administrator') return 'ADMIN';
    if (normalized === 'manager') return 'MANAGER';
    if (normalized === 'commercial' || normalized === 'sales') return 'COMMERCIAL';
    if (normalized === 'accountant' || normalized === 'finance') return 'ACCOUNTANT';
    if (normalized === 'magasinier' || normalized === 'warehouse_manager' || normalized === 'warehouse') return 'WAREHOUSE_MANAGER';
    return 'USER';
}
