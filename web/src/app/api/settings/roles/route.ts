import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const roles = await prisma.appRole.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(roles);
    } catch (error: any) {
        console.error('Error fetching settings roles:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        const currentUserId = await getUserId();
        if (!companyId || !currentUserId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { name, displayName, description, permissionIds } = await request.json();

        if (!name || !displayName) {
            return NextResponse.json({ error: 'Nom et nom d\'affichage requis' }, { status: 400 });
        }

        const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');
        const existingRole = await prisma.appRole.findUnique({
            where: { name: cleanName }
        });

        if (existingRole) {
            return NextResponse.json({ error: 'Ce rôle existe déjà' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const role = await tx.appRole.create({
                data: {
                    name: cleanName,
                    displayName,
                    description,
                    isSystemRole: false
                }
            });

            if (permissionIds && Array.isArray(permissionIds)) {
                await tx.rolePermission.createMany({
                    data: permissionIds.map(pId => ({
                        roleId: role.id,
                        permissionId: pId,
                        grantedBy: currentUserId
                    }))
                });
            }

            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entity: 'Role',
                    entityId: role.id,
                    userId: currentUserId,
                    companyId,
                    newValues: { name: cleanName, displayName, description, permissionIds },
                    description: `Rôle custom créé : ${displayName}`
                }
            });

            return tx.appRole.findUnique({
                where: { id: role.id },
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error creating role:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
