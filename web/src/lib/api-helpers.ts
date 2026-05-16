import { headers } from 'next/headers';

/**
 * Extracts the tenant (company) ID from the Authorization header JWT.
 * Note: This is a lightweight decoder. In a full production environment, 
 * the JWT signature should be verified against the secret.
 */
export async function getTenantId(): Promise<string | null> {
    try {
        const headerList = await headers();
        const authHeader = headerList.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
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
