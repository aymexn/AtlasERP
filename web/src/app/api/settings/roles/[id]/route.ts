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
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { id: roleId } = await params;
        const { displayName, description, permissionIds } = await request.json();

        const role = await prisma.appRole.findUnique({
            where: { id: roleId }
        });

        if (!role) {
            return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (!role.isSystemRole) {
                if (displayName) updateData.displayName = displayName;
                if (description) updateData.description = description;
            }

            let updatedRole = role;
            if (Object.keys(updateData).length > 0) {
                updatedRole = await tx.appRole.update({
                    where: { id: roleId },
                    data: updateData
                });
            }

            let oldIds: string[] = [];
            if (!role.isSystemRole && permissionIds && Array.isArray(permissionIds)) {
                const oldPerms = await tx.rolePermission.findMany({
                    where: { roleId },
                    select: { permissionId: true }
                });
                oldIds = oldPerms.map(op => op.permissionId);

                await tx.rolePermission.deleteMany({
                    where: { roleId }
                });

                if (permissionIds.length > 0) {
                    await tx.rolePermission.createMany({
                        data: permissionIds.map(pId => ({
                            roleId,
                            permissionId: pId,
                            grantedBy: currentUserId
                        }))
                    });
                }
            }

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Role',
                    entityId: roleId,
                    userId: currentUserId,
                    companyId,
                    oldValues: { displayName: role.displayName, description: role.description, permissionIds: oldIds },
                    newValues: { displayName, description, permissionIds },
                    description: `Rôle mis à jour : ${role.displayName}`
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating role:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id: roleId } = await params;

        const role = await prisma.appRole.findUnique({
            where: { id: roleId }
        });

        if (!role) {
            return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
        }

        if (role.isSystemRole) {
            return NextResponse.json({ error: 'Impossible de supprimer un rôle système' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId } });
            await tx.userRole.deleteMany({ where: { roleId } });
            await tx.appRole.delete({ where: { id: roleId } });

            await tx.auditLog.create({
                data: {
                    action: 'DELETE',
                    entity: 'Role',
                    entityId: roleId,
                    userId: currentUserId,
                    companyId,
                    description: `Rôle supprimé : ${role.displayName}`
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
