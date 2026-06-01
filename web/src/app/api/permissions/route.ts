import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const permissions = await prisma.appPermission.findMany({
            orderBy: [
                { module: 'asc' },
                { resource: 'asc' },
                { action: 'asc' }
            ]
        });

        return NextResponse.json(permissions);
    } catch (error: any) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
