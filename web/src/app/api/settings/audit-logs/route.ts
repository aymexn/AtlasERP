import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const userId = searchParams.get('userId') || '';
        const action = searchParams.get('action') || '';
        const entity = searchParams.get('module') || '';
        const from = searchParams.get('from') || '';
        const to = searchParams.get('to') || '';

        const skip = (page - 1) * limit;

        const whereClause: any = { companyId };

        if (userId) {
            whereClause.userId = userId;
        }

        if (action) {
            whereClause.action = action;
        }

        if (entity) {
            whereClause.entity = {
                contains: entity,
                mode: 'insensitive'
            };
        }

        if (from || to) {
            whereClause.createdAt = {};
            if (from) {
                whereClause.createdAt.gte = new Date(from);
            }
            if (to) {
                whereClause.createdAt.lte = new Date(to);
            }
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.auditLog.count({ where: whereClause })
        ]);

        return NextResponse.json({ logs, total, page, limit });
    } catch (error: any) {
        console.error('Error fetching settings audit logs:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
