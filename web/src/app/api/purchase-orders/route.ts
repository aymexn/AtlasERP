import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/api-helpers';
import { cookies } from 'next/headers';
import { requirePermission } from '@/lib/require-permission';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('atlas_token')?.value || '';
}

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = await requirePermission('purchases', 'order', 'read', request);
        if (denied) return denied;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || '';
        const token = await getAuthToken();

        const res = await fetch(`${BACKEND_URL}/purchase-orders${status ? `?status=${status}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy GET PurchaseOrders Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = await requirePermission('purchases', 'order', 'create', request);
        if (denied) return denied;

        const body = await request.json();
        const token = await getAuthToken();

        const res = await fetch(`${BACKEND_URL}/purchase-orders`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy POST PurchaseOrders Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
