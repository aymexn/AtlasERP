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

        const automation = await prisma.aiAutomation.findUnique({
            where: { id, companyId }
        });

        if (!automation) {
            return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
        }

        const updated = await prisma.aiAutomation.update({
            where: { id },
            data: { isActive: !automation.isActive }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('AI Automations Toggle POST Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
