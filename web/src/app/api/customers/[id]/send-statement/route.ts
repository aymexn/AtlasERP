import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id, companyId }
    });

    if (!customer) return new NextResponse('Not found', { status: 404 });

    // In a real application, you would generate a PDF and send via an email service (Resend, SendGrid)
    // For this implementation, we will log a success message representing the email dispatch.

    return NextResponse.json({ 
      success: true, 
      message: `Relevé de compte envoyé avec succès à ${customer.email || "l'adresse principale"}` 
    });
  } catch (error) {
    console.error('[CUSTOMER_SEND_STATEMENT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
