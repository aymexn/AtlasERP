import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId, mapAppRoleToEnumRole } from '@/lib/api-helpers';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId || !currentUserId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();
        const { email: rawEmail, roleId } = body;

        if (!rawEmail || !roleId) {
            return NextResponse.json({ error: 'E-mail et Rôle requis' }, { status: 400 });
        }

        const email = rawEmail.trim().toLowerCase();
        
        // Check duplication (prevent duplicate even if status is PENDING)
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Cet utilisateur collabore déjà avec une entreprise' }, { status: 409 });
        }

        // Verify role exists
        const roleExists = await prisma.appRole.findUnique({ where: { id: roleId } });
        if (!roleExists) {
            return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
        }

        // Retrieve company details
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });
        const companyName = company?.name || 'Votre entreprise';

        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpires = new Date();
        invitationExpires.setDate(invitationExpires.getDate() + 7); // 7-day expiration

        const newUser = await prisma.$transaction(async (tx) => {
            const u = await tx.user.create({
                data: {
                    email,
                    status: 'PENDING',
                    companyId,
                    role: mapAppRoleToEnumRole(roleExists.name),
                    passwordHash: null,
                    invitationToken,
                    invitationExpires,
                }
            });

            await tx.userRole.create({
                data: {
                    userId: u.id,
                    roleId,
                    isActive: true,
                    assignedBy: currentUserId
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entity: 'User',
                    entityId: u.id,
                    userId: currentUserId,
                    companyId,
                    newValues: { email, status: 'PENDING', roleId },
                    description: `Invitation envoyée à ${email} avec le rôle ${roleExists.displayName}`
                }
            });

            return u;
        });

        // Send actual invitation email
        try {
            await sendInvitationEmail({
                to: email,
                token: invitationToken,
                roleName: roleExists.displayName,
                companyName: companyName
            });
        } catch (mailError) {
            console.error('Failed to send invitation email, rolling back database creations:', mailError);
            
            // Cleanup database creations
            await prisma.userRole.deleteMany({ where: { userId: newUser.id } });
            await prisma.user.delete({ where: { id: newUser.id } });
            
            return NextResponse.json({ 
                error: "L'envoi de l'e-mail d'invitation a échoué. L'invitation a été annulée." 
            }, { status: 500 });
        }

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        console.error('Error inviting user:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
