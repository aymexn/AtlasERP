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
        const body = await request.json();
        const { permissionIds } = body; // Array of strings (permission IDs)

        if (!Array.isArray(permissionIds)) {
            return NextResponse.json({ error: 'permissionIds doit être un tableau' }, { status: 400 });
        }

        // Verify role exists
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
            // Get old permissions for audit log
            const oldPerms = await tx.rolePermission.findMany({
                where: { roleId },
                select: { permissionId: true }
            });
            const oldIds = oldPerms.map(op => op.permissionId);

            // Delete existing permissions for this role
            await tx.rolePermission.deleteMany({
                where: { roleId }
            });

            // Create new ones
            if (permissionIds.length > 0) {
                const newRolePerms = permissionIds.map(pId => ({
                    roleId,
                    permissionId: pId,
                    grantedBy: currentUserId
                }));
                await tx.rolePermission.createMany({
                    data: newRolePerms
                });
            }

            // Create audit log
            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Role',
                    entityId: roleId,
                    userId: currentUserId,
                    companyId,
                    oldValues: { permissionIds: oldIds },
                    newValues: { permissionIds },
                    description: `Permissions synchronisées pour le rôle : ${role.displayName}`
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error syncing role permissions:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}

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

        const { id: roleId } = await params;
        const body = await request.json();
        let { permissionIds } = body;

        if (!permissionIds) {
            return NextResponse.json({ error: 'permissionIds requis' }, { status: 400 });
        }

        // Handle case where permissionIds is a single string (backward compatibility)
        if (typeof permissionIds === 'string') {
            permissionIds = [permissionIds];
        }

        if (!Array.isArray(permissionIds)) {
            return NextResponse.json({ error: 'Format de permissionIds incorrect' }, { status: 400 });
        }

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
            const added: string[] = [];
            for (const pId of permissionIds) {
                // Upsert or create mapping
                const exists = await tx.rolePermission.findUnique({
                    where: {
                        roleId_permissionId: { roleId, permissionId: pId }
                    }
                });

                if (!exists) {
                    await tx.rolePermission.create({
                        data: {
                            roleId,
                            permissionId: pId,
                            grantedBy: currentUserId
                        }
                    });
                    added.push(pId);
                }
            }

            if (added.length > 0) {
                await tx.auditLog.create({
                    data: {
                        action: 'UPDATE',
                        entity: 'Role',
                        entityId: roleId,
                        userId: currentUserId,
                        companyId,
                        newValues: { addedPermissionIds: added },
                        description: `Permissions ajoutées au rôle ${role.displayName} : ${added.join(', ')}`
                    }
                });
            }

            return { success: true, addedCount: added.length };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error adding role permissions:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
