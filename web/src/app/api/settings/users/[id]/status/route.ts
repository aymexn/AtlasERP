import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        const { status } = await request.json();

        if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { id, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable dans cette entreprise' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id },
                data: { status: status as any }
            });

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'User',
                    entityId: id,
                    userId: currentUserId,
                    companyId,
                    oldValues: { status: user.status },
                    newValues: { status },
                    description: `Statut modifié pour l'utilisateur : ${user.email} -> ${status}`
                }
            });

            return updated;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error modifying user status:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
