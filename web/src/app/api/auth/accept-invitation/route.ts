import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
    }

    if (user.invitationExpires && new Date() > user.invitationExpires) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        invitationToken: null,
        invitationExpires: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Invitation accepted successfully' });

  } catch (error) {
    console.error('[API_AUTH_ACCEPT_INVITE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
