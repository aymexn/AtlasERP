import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const alerts = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                trackStock: true,
                stockQuantity: {
                    lte: prisma.product.fields.reorderPoint
                }
            },
            include: {
                preferredSupplier: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                stockQuantity: 'asc'
            }
        });

        // Map standard fields to float and format
        const formattedAlerts = alerts.map(p => {
            const qty = Number(p.stockQuantity || 0);
            const threshold = Number(p.reorderPoint || 0);
            const lack = threshold - qty;

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                stockQuantity: qty,
                reorderPoint: threshold,
                lack: Math.max(0, lack),
                unit: p.unit || 'PCS',
                supplierName: p.preferredSupplier?.name || '—'
            };
        });

        return NextResponse.json(formattedAlerts);
    } catch (error: any) {
        console.error('Failed to fetch replenishment alerts:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
