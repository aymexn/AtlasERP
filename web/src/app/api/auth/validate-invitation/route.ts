import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Lien d\'invitation invalide' }, { status: 400 });
    }

    if (user.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cette invitation a déjà été acceptée' }, { status: 400 });
    }

    if (user.invitationExpires && new Date() > user.invitationExpires) {
      return NextResponse.json({ error: 'Ce lien d\'invitation a expiré' }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: user.email });

  } catch (error) {
    console.error('[API_AUTH_VALIDATE_INVITE] Error:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
