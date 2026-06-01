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
        const query = searchParams.get('q') || '';

        const whereClause: any = { companyId };

        if (query) {
            whereClause.OR = [
                {
                    action: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    entity: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    user: {
                        email: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                }
            ];
        }

        const logs = await prisma.auditLog.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // Cap at 100 recent activities for performance
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
