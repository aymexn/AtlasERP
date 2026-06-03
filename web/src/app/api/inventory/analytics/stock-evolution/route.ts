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

        // Fetch active products to calculate current stock value
        const products = await prisma.product.findMany({
            where: { companyId, isActive: true },
            select: {
                id: true,
                stockQuantity: true,
                standardCost: true
            }
        });

        let currentTotalValue = 0;
        for (const p of products) {
            currentTotalValue += Number(p.stockQuantity || 0) * Number(p.standardCost || 0);
        }

        // Fetch all movements in the last 7 months to project backward
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

        // Generate the last 7 months list
        const stockEvolution = [];
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(1); // prevent month overflow
            d.setMonth(d.getMonth() - i - 1); // get past completed months

            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const label = `${monthNames[endOfMonth.getMonth()]} ${endOfMonth.getFullYear()}`;

            // Reconstruct stock value at endOfMonth
            let reconstructedValue = currentTotalValue;
            for (const m of movements) {
                if (m.date > endOfMonth) {
                    const movementValue = Number(m.totalCost || 0);
                    if (m.type === 'IN') {
                        reconstructedValue -= movementValue;
                    } else if (m.type === 'OUT') {
                        reconstructedValue += movementValue;
                    }
                }
            }

            stockEvolution.push({
                mois: label,
                valeur: Math.round(Math.max(0, reconstructedValue))
            });
        }

        return NextResponse.json(stockEvolution);
    } catch (error: any) {
        console.error('Failed to calculate stock evolution:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
