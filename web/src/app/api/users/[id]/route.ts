import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { roleId, status } = body;

        // Verify that the target user belongs to the same tenant
        const user = await prisma.user.findFirst({
            where: { id, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable dans cette entreprise' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const oldValues: any = { status: user.status };
            const newValues: any = {};
            const updateData: any = {};

            if (status) {
                updateData.status = status;
                newValues.status = status;
            }

            let updatedUser = user;
            if (Object.keys(updateData).length > 0) {
                updatedUser = await tx.user.update({
                    where: { id },
                    data: updateData
                });
            }

            if (roleId) {
                // Fetch old roles for the log
                const oldUserRoles = await tx.userRole.findMany({
                    where: { userId: id, isActive: true },
                    select: { roleId: true }
                });
                oldValues.roles = oldUserRoles.map(ur => ur.roleId);

                // Deactivate/delete previous roles
                await tx.userRole.deleteMany({
                    where: { userId: id }
                });

                // Assign the new single role
                await tx.userRole.create({
                    data: {
                        userId: id,
                        roleId,
                        isActive: true
                    }
                });

                newValues.roles = [roleId];
            }

            // Create activity audit log
            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'User',
                    entityId: id,
                    userId: currentUserId,
                    companyId,
                    oldValues,
                    newValues,
                    description: `Mise à jour de l'utilisateur : ${user.email}`
                }
            });

            return updatedUser;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating user:', error);
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
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const { id } = await params;

        // Verify user exists and belongs to the same tenant
        const user = await prisma.user.findFirst({
            where: { id, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Update status to SUSPENDED instead of deleting physically
            const suspendedUser = await tx.user.update({
                where: { id },
                data: { status: 'SUSPENDED' }
            });

            await tx.auditLog.create({
                data: {
                    action: 'DELETE',
                    entity: 'User',
                    entityId: id,
                    userId: currentUserId,
                    companyId,
                    oldValues: { status: user.status },
                    newValues: { status: 'SUSPENDED' },
                    description: `Utilisateur suspendu : ${user.email}`
                }
            });

            return suspendedUser;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
