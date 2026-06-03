import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId, mapAppRoleToEnumRole } from '@/lib/api-helpers';

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
        const { roleId } = await request.json();

        if (!roleId) {
            return NextResponse.json({ error: 'Rôle requis' }, { status: 400 });
        }

        // Verify target user belongs to same tenant
        const user = await prisma.user.findFirst({
            where: { id, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable dans cette entreprise' }, { status: 404 });
        }

        const role = await prisma.appRole.findUnique({
            where: { id: roleId }
        });

        if (!role) {
            return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Get old roles
            const oldRoles = await tx.userRole.findMany({
                where: { userId: id, isActive: true }
            });

            await tx.userRole.deleteMany({
                where: { userId: id }
            });

            await tx.userRole.create({
                data: {
                    userId: id,
                    roleId,
                    isActive: true,
                    assignedBy: currentUserId
                }
            });

            await tx.user.update({
                where: { id },
                data: {
                    role: mapAppRoleToEnumRole(role.name)
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'User',
                    entityId: id,
                    userId: currentUserId,
                    companyId,
                    oldValues: { roles: oldRoles.map(r => r.roleId) },
                    newValues: { roles: [roleId] },
                    description: `Rôle modifié pour l'utilisateur : ${user.email} -> ${role.displayName}`
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error modifying user role:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
