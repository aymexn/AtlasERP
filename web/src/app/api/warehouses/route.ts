import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/api-helpers';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('atlas_token')?.value || '';
}

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = await getAuthToken();

        const res = await fetch(`${BACKEND_URL}/inventory/warehouses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy GET Warehouses Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
