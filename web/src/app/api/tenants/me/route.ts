import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error: any) {
        console.error('Error fetching company details:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const body = await request.json();
        const { name, nif, rc, ai, rib, address, phone, email, website, logoUrl } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nom de l\'entreprise requis' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const oldCompany = await tx.company.findUnique({
                where: { id: companyId }
            });

            const company = await tx.company.update({
                where: { id: companyId },
                data: {
                    name,
                    nif: nif || null,
                    rc: rc || null,
                    ai: ai || null,
                    rib: rib || null,
                    address: address || null,
                    phone: phone || null,
                    email: email || null,
                    website: website || null,
                    logoUrl: logoUrl || null
                }
            });

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Company',
                    entityId: companyId,
                    userId: currentUserId,
                    companyId,
                    oldValues: oldCompany ? {
                        name: oldCompany.name,
                        nif: oldCompany.nif,
                        rc: oldCompany.rc,
                        ai: oldCompany.ai,
                        rib: oldCompany.rib,
                        address: oldCompany.address,
                        phone: oldCompany.phone,
                        email: oldCompany.email,
                        website: oldCompany.website,
                        logoUrl: oldCompany.logoUrl
                    } : undefined,
                    newValues: { name, nif, rc, ai, rib, address, phone, email, website, logoUrl },
                    description: `Mise à jour des paramètres de l'entreprise : ${name}`
                }
            });

            return company;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating company details:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
