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

        const logs = await prisma.activityLog.findMany({
            where: { customerId: id, module: 'Customer' },
            orderBy: { createdAt: 'desc' }
        });

        const interactions = logs.map(log => {
            const details = (log.details as any) || {};
            return {
                id: log.id,
                type: log.action,
                direction: details.direction || 'OUTBOUND',
                subject: details.subject || log.action,
                content: details.content || '',
                createdAt: log.createdAt
            };
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

        const body = await request.json();
        if (!body.subject || !body.content) {
            return NextResponse.json({ error: 'Subject and Content are required' }, { status: 400 });
        }

        const newLog = await prisma.activityLog.create({
            data: {
                customerId: id,
                action: body.type || 'NOTE',
                module: 'Customer',
                details: {
                    direction: body.direction || 'OUTBOUND',
                    subject: body.subject,
                    content: body.content
                }
            }
        });

        const interaction = {
            id: newLog.id,
            type: newLog.action,
            direction: (newLog.details as any)?.direction || 'OUTBOUND',
            subject: (newLog.details as any)?.subject || newLog.action,
            content: (newLog.details as any)?.content || '',
            createdAt: newLog.createdAt
        };

        return NextResponse.json(interaction);
    } catch (error) {
        console.error('Interactions POST Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
