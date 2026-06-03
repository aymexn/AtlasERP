import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: { companyId },
                include: {
                    roles: {
                        where: { isActive: true },
                        include: { role: true }
                    }
                },
                orderBy: { email: 'asc' },
                skip,
                take: limit
            }),
            prisma.user.count({ where: { companyId } })
        ]);

        return NextResponse.json({ users, total, page, limit });
    } catch (error: any) {
        console.error('Error fetching settings users:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
