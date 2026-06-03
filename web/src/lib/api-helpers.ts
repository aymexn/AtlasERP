import { headers, cookies } from 'next/headers';

/**
 * Extracts the tenant (company) ID from the Authorization header JWT or cookie.
 * Note: This is a lightweight decoder. In a full production environment, 
 * the JWT signature should be verified against the secret.
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

        if (!token) return null;

        const base64Payload = token.split('.')[1];
        if (!base64Payload) return null;

        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        return payload.companyId || null;
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

        if (!token) return null;

        const base64Payload = token.split('.')[1];
        if (!base64Payload) return null;

        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        return payload.sub || null;
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

