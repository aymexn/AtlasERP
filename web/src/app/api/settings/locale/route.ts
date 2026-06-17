import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/api-helpers';

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Non autorisé : Session active introuvable' }, { status: 401 });
        }

        const body = await request.json();
        const { locale } = body;

        if (!locale || !['fr', 'en', 'ar'].includes(locale)) {
            return NextResponse.json({ error: 'Langue invalide' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { preferredLocale: locale }
        });

        return NextResponse.json({ success: true, preferredLocale: updatedUser.preferredLocale });
    } catch (error: any) {
        console.error('Error updating user preferred locale:', error);
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
