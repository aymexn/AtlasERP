import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                trackStock: true,
            },
            select: {
                id: true,
                name: true,
                sku: true,
                stockQuantity: true,
                reorderPoint: true,
                unit: true,
                preferredSupplier: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Filter and map in Javascript for absolute reliability
        const alerts = products
            .map((p: any) => {
                const qty = Number(p.stockQuantity || 0);
                const reorder = Number(p.reorderPoint || 0);
                const hasAlert = (qty <= reorder && reorder > 0) || qty <= 0;

                return {
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    stockQuantity: qty,
                    reorderPoint: reorder,
                    unit: p.unit || 'PCS',
                    supplierName: p.preferredSupplier?.name || null,
                    urgency: qty - reorder,
                    hasAlert
                };
            })
            .filter(p => p.hasAlert);

        // Order by urgency ASC (most urgent first)
        alerts.sort((a, b) => a.urgency - b.urgency);

        // Strip helper property from response payload
        const responseData = alerts.map(({ hasAlert, urgency, ...rest }) => rest);

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Failed to get inventory alerts:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
