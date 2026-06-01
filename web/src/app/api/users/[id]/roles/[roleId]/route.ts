import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; roleId: string }> }
) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { id: userId, roleId } = await params;

        // Verify target user belongs to same company
        const user = await prisma.user.findFirst({
            where: { id: userId, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Delete user role assignment
            const deleted = await tx.userRole.deleteMany({
                where: { userId, roleId }
            });

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'User',
                    entityId: userId,
                    userId: currentUserId,
                    companyId,
                    oldValues: { revokedRoleId: roleId },
                    description: `Rôle révoqué pour l'utilisateur : ${user.email}`
                }
            });

            return { count: deleted.count };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error revoking user role:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
