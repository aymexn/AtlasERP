import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { id: userId } = await params;
        const body = await request.json().catch(() => ({}));
        const { roleId } = body;

        if (!roleId) {
            return NextResponse.json({ error: 'Rôle ID requis' }, { status: 400 });
        }

        // Verify target user belongs to same company
        const user = await prisma.user.findFirst({
            where: { id: userId, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const userRole = await tx.userRole.upsert({
                where: {
                    userId_roleId: { userId, roleId }
                },
                update: {
                    isActive: true
                },
                create: {
                    userId,
                    roleId,
                    isActive: true
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'User',
                    entityId: userId,
                    userId: currentUserId,
                    companyId,
                    newValues: { assignedRoleId: roleId },
                    description: `Rôle assigné à l'utilisateur : ${user.email}`
                }
            });

            return userRole;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error assigning user role:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
