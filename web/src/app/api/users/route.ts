import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function GET() {
    try {
        const companyId = await getTenantId();
        const userId = await getUserId();
        if (!companyId || !userId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: { companyId },
            select: {
                id: true,
                email: true,
                status: true,
                roles: {
                    where: { isActive: true },
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                displayName: true
                            }
                        }
                    }
                }
            },
            orderBy: { email: 'asc' }
        });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('[GET /api/users] Error:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const companyId = await getTenantId();
        const userId = await getUserId();
        if (!companyId || !userId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        // ── Parse & Validate Payload ──────────────────────────────────────────
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
        }

        const { email: rawEmail, roleId } = body;

        if (!rawEmail || typeof rawEmail !== 'string') {
            return NextResponse.json({ error: 'Adresse e-mail requise' }, { status: 400 });
        }

        if (!roleId || typeof roleId !== 'string') {
            return NextResponse.json({ error: 'Rôle requis' }, { status: 400 });
        }

        // Normalize email
        const email = rawEmail.trim().toLowerCase();

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Format d\'adresse e-mail invalide' }, { status: 400 });
        }

        // ── Duplicate Check — 409 Conflict ────────────────────────────────────
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Cet utilisateur collabore déjà avec une entreprise' },
                { status: 409 }
            );
        }

        // ── Verify role exists ─────────────────────────────────────────────────
        const roleExists = await prisma.appRole.findUnique({ where: { id: roleId } });
        if (!roleExists) {
            return NextResponse.json({ error: 'Rôle introuvable' }, { status: 404 });
        }

        // ── Transactional Creation ─────────────────────────────────────────────
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpires = new Date();
        invitationExpires.setHours(invitationExpires.getHours() + 24); // 24h expiry

        // Generate a secure random temp password hash (user cannot log in until they set their password)
        const tempPassword = crypto.randomBytes(24).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const result = await prisma.$transaction(async (tx) => {
            // Create user with PENDING status
            const newUser = await tx.user.create({
                data: {
                    email,
                    status: 'PENDING',
                    // companyId extracted from verified session — never from body
                    companyId: companyId,
                    role: 'EMPLOYEE', // system-level fallback role
                    passwordHash, // secure hash, not plaintext
                    invitationToken,
                    invitationExpires,
                }
            });

            // Assign the requested AppRole
            await tx.userRole.create({
                data: {
                    userId: newUser.id,
                    roleId,
                    isActive: true,
                    assignedBy: userId,
                }
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entity: 'User',
                    entityId: newUser.id,
                    userId: userId,
                    companyId: companyId,
                    newValues: { email, status: 'PENDING', roleId },
                    description: `Invitation envoyée à ${email} avec le rôle ${roleExists.displayName} par l'administrateur ${userId}`,
                }
            });

            return newUser;
        });

        // ── Email dispatch (mock — replace with Resend/Nodemailer in production) ──
        const invitationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/fr/auth/accept-invitation?token=${invitationToken}`;
        console.log(`[INVITATION] To: ${email}`);
        console.log(`[INVITATION] Link: ${invitationLink}`);
        console.log(`[INVITATION] Expires: ${invitationExpires.toISOString()}`);

        return NextResponse.json({
            id: result.id,
            email: result.email,
            status: result.status,
            invitationLink, // useful for dev/testing
        }, { status: 201 });

    } catch (error: any) {
        console.error('[POST /api/users] Error:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
