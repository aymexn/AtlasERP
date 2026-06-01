import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/api-helpers';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('atlas_token')?.value || '';
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const companyId = await getTenantId();
        if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = await getAuthToken();

        const res = await fetch(`${BACKEND_URL}/purchase-orders/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy GET PurchaseOrder ID Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const companyId = await getTenantId();
        if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const token = await getAuthToken();

        const res = await fetch(`${BACKEND_URL}/purchase-orders/${id}`, {
            method: 'PATCH',
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
        console.error('Proxy PATCH PurchaseOrder Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
