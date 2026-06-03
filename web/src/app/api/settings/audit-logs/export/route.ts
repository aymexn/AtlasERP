import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return new Response('Unauthorized', { status: 401 });
        }

        const logs = await prisma.auditLog.findMany({
            where: { companyId },
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        let csvContent = '\uFEFFDate;Utilisateur;Action;Ressource;Details\n';
        for (const log of logs) {
            const date = new Date(log.createdAt).toLocaleString('fr-FR');
            const user = log.user?.email || 'Système';
            const action = log.action;
            const entity = log.entity;
            const details = (log.description || '').replace(/"/g, '""');

            csvContent += `"${date}";"${user}";"${action}";"${entity}";"${details}"\n`;
        }

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="audit_logs.csv"'
            }
        });
    } catch (error: any) {
        console.error('Error exporting audit logs:', error);
        return new Response('Error exporting data', { status: 500 });
    }
}
