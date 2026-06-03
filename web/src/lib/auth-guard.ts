import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { headers, cookies } from 'next/headers';

export async function getUserRoleFromToken(): Promise<Role | null> {
    try {
        const headerList = await headers();
        const authHeader = headerList.get('authorization');
        let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        
        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get('atlas_token')?.value || null;
        }

        if (!token) return null;

        const base64Payload = token.split('.')[1];
        if (!base64Payload) return null;

        const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        return (payload.role as Role) || null;
    } catch (error) {
        console.error('Error extracting user role from token:', error);
        return null;
    }
}

export async function requireRole(allowedRoles: Role | Role[]) {
    // 1. Try to get role from custom token (atlas_token)
    let userRole = await getUserRoleFromToken();

    let session = null;
    if (!userRole) {
        // 2. Fallback to NextAuth session
        session = await auth();
        userRole = session?.user?.role || null;
    }

    if (!userRole) {
        throw new Response("Non authentifié", { status: 401 });
    }

    const allowed = Array.isArray(allowedRoles)
        ? allowedRoles.includes(userRole)
        : userRole === allowedRoles;

    if (!allowed) {
        throw new Response("Accès interdit : rôle insuffisant", { status: 403 });
    }

    return session || { user: { role: userRole } };
}
