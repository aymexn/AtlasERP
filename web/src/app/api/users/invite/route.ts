import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine the companyId from session
    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company context' }, { status: 403 });
    }

    // In a real app, you'd check (session.user as any).companyRole for "user:invite" permission here
    // For now, we assume the user is authorized to invite if they have a session in this company

    const body = await req.json();
    const { email, companyRoleId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const invitationToken = crypto.randomUUID();
    const invitationExpires = new Date();
    invitationExpires.setDate(invitationExpires.getDate() + 7); // Expires in 7 days

    const newUser = await prisma.user.create({
      data: {
        email,
        companyId,
        companyRoleId: companyRoleId || null,
        status: 'PENDING',
        invitationToken,
        invitationExpires,
      },
    });

    // TODO: Actually send an email via Resend, Nodemailer, etc.
    console.log(`[INVITATION EMAIL MOCK] Sent to: ${email}`);
    console.log(`[INVITATION EMAIL MOCK] Link: http://localhost:3001/auth/accept-invitation?token=${invitationToken}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent',
      user: { id: newUser.id, email: newUser.email }
    });

  } catch (error) {
    console.error('[API_USERS_INVITE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
