import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const now = new Date();
        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

        // Fetch movements in the last 7 months
        const movements = await prisma.stockMovement.findMany({
            where: {
                companyId,
                date: { gte: sevenMonthsAgo }
            },
            select: {
                type: true,
                totalCost: true,
                date: true
            },
            orderBy: { date: 'asc' }
        });

        // Generate past 7 completed months
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
        const movementsByMonth = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(1); // prevent month overflow
            d.setMonth(d.getMonth() - i - 1);
            
            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const label = `${monthNames[startOfMonth.getMonth()]} ${startOfMonth.getFullYear()}`;

            // Filter movements in this month
            const monthMovements = movements.filter(m => m.date >= startOfMonth && m.date <= endOfMonth);

            const entrees = monthMovements
                .filter(m => m.type === 'IN')
                .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

            const sorties = monthMovements
                .filter(m => m.type === 'OUT')
                .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

            movementsByMonth.push({
                mois: label,
                entrees: Math.round(entrees),
                sorties: Math.round(sorties)
            });
        }

        return NextResponse.json(movementsByMonth);
    } catch (error: any) {
        console.error('Failed to calculate monthly movements:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
