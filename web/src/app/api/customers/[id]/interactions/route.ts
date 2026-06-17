import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, getUserId } from '@/lib/api-helpers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const interactions = await prisma.customerInteraction.findMany({
            where: { customerId: id, companyId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(interactions);
    } catch (error) {
        console.error('Interactions GET Route Error:', error);
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
        const userId = await getUserId();

        const body = await request.json();
        if (!body.subject || !body.content) {
            return NextResponse.json({ error: 'Subject and Content are required' }, { status: 400 });
        }

        const newInteraction = await prisma.customerInteraction.create({
            data: {
                companyId,
                customerId: id,
                type: body.type || 'NOTE',
                direction: body.direction || 'OUTBOUND',
                subject: body.subject,
                content: body.content,
                durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : null,
                status: 'COMPLETED',
                createdBy: userId
            }
        });

        return NextResponse.json(newInteraction);
    } catch (error) {
        console.error('Interactions POST Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
