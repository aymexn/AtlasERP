import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

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

        const { id } = await params;

        const user = await prisma.user.findFirst({
            where: { id, companyId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable dans cette entreprise' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Nullify/delete blocking child relations
            await tx.userRole.deleteMany({ where: { userId: id } });
            await tx.activityFeed.deleteMany({ where: { userId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });
            await tx.aiChatHistory.deleteMany({ where: { userId: id } });

            // Nullify references in related records
            await tx.employee.updateMany({
                where: { userId: id },
                data: { userId: null }
            });
            await tx.project.updateMany({
                where: { projectManagerId: id },
                data: { projectManagerId: null }
            });
            await tx.projectTask.updateMany({
                where: { assignedToId: id },
                data: { assignedToId: null }
            });
            await tx.projectTask.updateMany({
                where: { reporterId: id },
                data: { reporterId: null }
            });
            await tx.taskComment.deleteMany({ where: { authorId: id } });
            await tx.calendarEvent.deleteMany({ where: { organizerId: id } });
            await tx.collaborationDocument.updateMany({
                where: { uploadedBy: id },
                data: { uploadedBy: null }
            });
            await tx.approvalRequest.deleteMany({
                where: {
                    OR: [
                        { requesterId: id },
                        { decidedBy: id }
                    ]
                }
            });
            await tx.message.deleteMany({
                where: {
                    OR: [
                        { senderId: id },
                        { recipientId: id }
                    ]
                }
            });
            await tx.permissionAuditLog.deleteMany({
                where: {
                    OR: [
                        { userId: id },
                        { targetUserId: id }
                    ]
                }
            });

            // Hard delete user
            const deleted = await tx.user.delete({
                where: { id }
            });

            // Write a system audit log for user deletion
            await tx.auditLog.create({
                data: {
                    action: 'DELETE',
                    entity: 'User',
                    entityId: id,
                    userId: currentUserId || id,
                    companyId,
                    oldValues: { email: user.email, status: user.status },
                    description: `Utilisateur supprimé définitivement : ${user.email}`
                }
            });

            return deleted;
        }, {
            timeout: 20000
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error suspending user:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
