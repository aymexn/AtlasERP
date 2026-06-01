import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { id: roleId, permissionId } = await params;

        const role = await prisma.appRole.findUnique({
            where: { id: roleId }
        });

        if (!role) {
            return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
        }

        if (role.isSystemRole) {
            return NextResponse.json({ error: 'Impossible de modifier les permissions d\'un rôle système' }, { status: 403 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const deleted = await tx.rolePermission.deleteMany({
                where: { roleId, permissionId }
            });

            if (deleted.count > 0) {
                await tx.auditLog.create({
                    data: {
                        action: 'UPDATE',
                        entity: 'Role',
                        entityId: roleId,
                        userId: currentUserId,
                        companyId,
                        oldValues: { revokedPermissionId: permissionId },
                        description: `Permission révoquée du rôle ${role.displayName} : ${permissionId}`
                    }
                });
            }

            return { success: true, count: deleted.count };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error revoking role permission:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
