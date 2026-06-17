import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

// In-memory cache for user permissions to avoid database hitting on every request
const permissionsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds TTL

export async function GET() {
    try {
        const companyId = await getTenantId();
        const userId = await getUserId();
        
        if (!companyId || !userId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        // Check in-memory cache
        const cacheKey = `${companyId}:${userId}`;
        const cached = permissionsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }

        // Fetch user with their roles mapping to get user permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    where: { isActive: true },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user || user.companyId !== companyId) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const isSystemAdmin = user.role === 'ADMIN' || user.roles.some(r => ['admin', 'administrator'].includes(r.role.name.toLowerCase()));
        
        let permissionsList: any[] = [];
        let userRoles: any[] = [];

        if (isSystemAdmin) {
            // System Administrator gets ALL permissions in the system
            permissionsList = await prisma.appPermission.findMany();
            
            // If they don't have the ADMIN role mapping, mock or fetch
            userRoles = user.roles.map(r => ({
                id: r.role.id,
                name: r.role.name,
                displayName: r.role.displayName
            }));

            // Ensure an ADMIN role is present in roles list if they are admin
            if (!userRoles.some(r => ['admin', 'administrator', 'admin'].includes(r.name.toLowerCase()))) {
                const adminRole = await prisma.appRole.findFirst({
                    where: { name: { in: ['admin', 'administrator'], mode: 'insensitive' } }
                });
                if (adminRole) {
                    userRoles.push({
                        id: adminRole.id,
                        name: adminRole.name,
                        displayName: adminRole.displayName
                    });
                } else {
                    userRoles.push({
                        id: 'admin-mock-id',
                        name: 'ADMIN',
                        displayName: 'Administrateur'
                    });
                }
            }
        } else {
            // Get unique permissions from the user's roles
            const permMap = new Map<string, any>();
            user.roles.forEach(ur => {
                ur.role.permissions.forEach(rp => {
                    permMap.set(rp.permission.id, rp.permission);
                });
            });
            permissionsList = Array.from(permMap.values());
            
            userRoles = user.roles.map(r => ({
                id: r.role.id,
                name: r.role.name,
                displayName: r.role.displayName
            }));
        }

        // Group permissions by module and resource
        const grouped: Record<string, Record<string, string[]>> = {};
        permissionsList.forEach(p => {
            if (!grouped[p.module]) {
                grouped[p.module] = {};
            }
            if (!grouped[p.module][p.resource]) {
                grouped[p.module][p.resource] = [];
            }
            if (!grouped[p.module][p.resource].includes(p.action)) {
                grouped[p.module][p.resource].push(p.action);
            }
        });

        const responseData = {
            permissions: permissionsList,
            roles: userRoles,
            grouped
        };

        // Cache the response
        permissionsCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Error fetching current user permissions:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
