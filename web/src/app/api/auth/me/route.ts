import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/auth/me
 * Returns the current user's profile based on the NextAuth session.
 * This is used by AuthWrapper as a fallback when no atlas_token is present.
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch full user record from DB so we have employee name
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                companyId: true,
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                employee: user.employee ?? undefined,
            },
        });
    } catch (error) {
        console.error('[API_AUTH_ME_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
