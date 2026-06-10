import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
        }

        const { company, admin } = body;

        // 1. Basic validation
        if (!company || !admin) {
            return NextResponse.json({ error: 'Informations d\'entreprise et d\'administrateur requises' }, { status: 400 });
        }

        const { name: companyName, nif, rc, nis, ai, email: companyEmail, phone: companyPhone } = company;
        const { name: adminName, email: adminEmail, password } = admin;

        if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
            return NextResponse.json({ error: 'Nom de l\'entreprise requis' }, { status: 400 });
        }

        if (!nif || typeof nif !== 'string' || nif.trim().length !== 15) {
            return NextResponse.json({ error: 'Le NIF doit contenir exactement 15 chiffres' }, { status: 400 });
        }

        if (!rc || typeof rc !== 'string' || !/^\d{2}\/\d{2}-\d{7}[A-Z]\d{2}$/.test(rc.trim())) {
            return NextResponse.json({ error: 'Format du Registre du Commerce (RC) invalide. Attendu: 00/00-0000000B15' }, { status: 400 });
        }

        if (!nis || typeof nis !== 'string' || nis.trim().length !== 15) {
            return NextResponse.json({ error: 'Le NIS doit contenir exactement 15 chiffres' }, { status: 400 });
        }

        if (!adminName || typeof adminName !== 'string' || !adminName.trim()) {
            return NextResponse.json({ error: 'Nom complet de l\'administrateur requis' }, { status: 400 });
        }

        if (!adminEmail || typeof adminEmail !== 'string' || !adminEmail.includes('@')) {
            return NextResponse.json({ error: 'Email de l\'administrateur invalide' }, { status: 400 });
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
            return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
        }

        // Normalize emails
        const normalizedAdminEmail = adminEmail.trim().toLowerCase();
        const normalizedCompanyEmail = companyEmail ? companyEmail.trim().toLowerCase() : null;

        // 2. Check for duplicate admin email
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedAdminEmail }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Cette adresse email est déjà associée à un compte' },
                { status: 409 }
            );
        }

        // 3. Generate unique slug for company
        let slug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!slug) {
            slug = `company-${Math.random().toString(36).substring(2, 8)}`;
        }

        const existingCompany = await prisma.company.findUnique({
            where: { slug }
        });

        if (existingCompany) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
        }

        // 4. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 5. Transaction to create Company & User
        const result = await prisma.$transaction(async (tx) => {
            const newCompany = await tx.company.create({
                data: {
                    name: companyName.trim(),
                    slug,
                    nif: nif.trim(),
                    rc: rc.trim(),
                    // @ts-ignore
                    nis: nis.trim(),
                    ai: ai ? ai.trim() : null,
                    email: normalizedCompanyEmail,
                    phone: companyPhone ? companyPhone.trim() : null,
                }
            });

            const newUser = await tx.user.create({
                data: {
                    email: normalizedAdminEmail,
                    name: adminName.trim(),
                    passwordHash,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    companyId: newCompany.id,
                }
            });

            // Automatically assign system admin AppRole if it exists
            const adminRole = await tx.appRole.findUnique({
                where: { name: 'admin' }
            });
            if (adminRole) {
                await tx.userRole.create({
                    data: {
                        userId: newUser.id,
                        roleId: adminRole.id,
                        isActive: true,
                    }
                });
            }

            return { company: newCompany, user: newUser };
        });

        return NextResponse.json({
            success: true,
            companyId: result.company.id,
            userId: result.user.id
        }, { status: 201 });

    } catch (error: any) {
        console.error('[POST /api/auth/register] Server Error:', error);
        return NextResponse.json(
            { error: error.message || 'Une erreur interne est survenue lors de l\'inscription' },
            { status: 500 }
        );
    }
}
