import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const customer = await prisma.customer.findUnique({
            where: { id, companyId },
            include: {
                contacts: true
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json(customer.contacts || []);
    } catch (error) {
        console.error('Contacts Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

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

    const body = await request.json();
    const { name, firstName, lastName, position, email, phone, mobile, notes, isPrimary } = body;

    const contactName = name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!contactName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // If new isPrimary is true, unset others
    if (isPrimary) {
      await prisma.customerContact.updateMany({
        where: { customerId: id, companyId },
        data: { isPrimary: false }
      });
    }

    const newContact = await prisma.customerContact.create({
      data: {
        companyId,
        customerId: id,
        name: contactName,
        firstName,
        lastName,
        position,
        email,
        phone,
        mobile,
        notes,
        isPrimary: isPrimary || false
      }
    });

    return NextResponse.json(newContact);
  } catch (error) {
    console.error('[CUSTOMER_CONTACT_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
