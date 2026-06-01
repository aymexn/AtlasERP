import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        // 1. Fetch sales orders to see if there is enough data
        const orders = await prisma.salesOrder.findMany({
            where: {
                companyId,
                status: { not: 'CANCELLED' }
            },
            include: {
                customer: true,
                lines: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Minimum 5 orders constraint
        if (orders.length < 5) {
            return NextResponse.json({
                status: 'PENDING_DATA',
                message: "Modèle en cours d'apprentissage. Données insuffisantes pour segmenter votre portefeuille client (minimum 5 commandes requis)."
            });
        }

        // 2. Compute RFM Segmentation
        const customers = await prisma.customer.findMany({
            where: { companyId, isActive: true }
        });

        const customerOrdersMap: Record<string, typeof orders> = {};
        orders.forEach(o => {
            if (!customerOrdersMap[o.customerId]) {
                customerOrdersMap[o.customerId] = [];
            }
            customerOrdersMap[o.customerId].push(o);
        });

        const now = new Date();
        const rfmSegments: Record<string, { name: string; count: number; desc: string; clients: string[]; color: string }> = {
            'VIP': { name: 'Champions (VIP)', count: 0, desc: 'Acheté récemment, achète fréquemment et dépense beaucoup.', clients: [], color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' },
            'REGULAR': { name: 'Loyaux (Réguliers)', count: 0, desc: 'Acheteurs réguliers avec un bon panier moyen.', clients: [], color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20' },
            'REACTIVATE': { name: 'À réactiver', count: 0, desc: 'Clients fidèles historiques, mais n\'ont pas commandé depuis 30 jours.', clients: [], color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/20' },
            'LOST': { name: 'À Risque (Perdus)', count: 0, desc: 'Inactifs depuis longtemps avec un panier moyen faible.', clients: [], color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' }
        };

        customers.forEach(c => {
            const cOrders = customerOrdersMap[c.id] || [];
            if (cOrders.length === 0) {
                rfmSegments['LOST'].count++;
                rfmSegments['LOST'].clients.push(c.name);
                return;
            }

            // Recency: days since last order
            const lastOrderDate = new Date(Math.max(...cOrders.map(o => new Date(o.date).getTime())));
            const diffTime = Math.abs(now.getTime() - lastOrderDate.getTime());
            const recencyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Frequency: total orders
            const frequency = cOrders.length;

            // Monetary: total spent
            const monetary = cOrders.reduce((sum, o) => sum + Number(o.totalAmountTtc), 0);

            // Simple RFM Scoring
            const rScore = recencyDays <= 30 ? 4 : recencyDays <= 90 ? 3 : recencyDays <= 180 ? 2 : 1;
            const fScore = frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1;
            const mScore = monetary >= 100000 ? 4 : monetary >= 50000 ? 3 : monetary >= 10000 ? 2 : 1;

            const totalScore = rScore + fScore + mScore;

            if (totalScore >= 9) {
                rfmSegments['VIP'].count++;
                rfmSegments['VIP'].clients.push(c.name);
            } else if (totalScore >= 6) {
                rfmSegments['REGULAR'].count++;
                rfmSegments['REGULAR'].clients.push(c.name);
            } else if (totalScore >= 4) {
                rfmSegments['REACTIVATE'].count++;
                rfmSegments['REACTIVATE'].clients.push(c.name);
            } else {
                rfmSegments['LOST'].count++;
                rfmSegments['LOST'].clients.push(c.name);
            }
        });

        const rfmList = Object.values(rfmSegments);

        // 3. Market Basket Analysis
        const productCounts: Record<string, number> = {};
        const pairCounts: Record<string, number> = {};
        let totalCarts = 0;

        orders.forEach(o => {
            const productIdsInOrder = Array.from(new Set(o.lines.map(l => l.product.name)));
            if (productIdsInOrder.length > 0) totalCarts++;

            productIdsInOrder.forEach(p => {
                productCounts[p] = (productCounts[p] || 0) + 1;
            });

            for (let i = 0; i < productIdsInOrder.length; i++) {
                for (let j = i + 1; j < productIdsInOrder.length; j++) {
                    const pairKey = [productIdsInOrder[i], productIdsInOrder[j]].sort().join(' && ');
                    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
                }
            }
        });

        const basketAssociations: any[] = [];
        Object.entries(pairCounts).forEach(([pairKey, count]) => {
            const [p1, p2] = pairKey.split(' && ');
            // Rule 1: p1 -> p2
            const confidence1 = Math.round((count / productCounts[p1]) * 100);
            const support = Math.round((count / totalCarts) * 100);
            const expectedConfidence2 = productCounts[p2] / totalCarts;
            const lift1 = Number(((count / productCounts[p1]) / expectedConfidence2).toFixed(1));

            if (confidence1 >= 30 && lift1 > 1.0) {
                basketAssociations.push({
                    antecedents: [p1],
                    consequents: [p2],
                    confidence: confidence1,
                    support,
                    lift: lift1
                });
            }

            // Rule 2: p2 -> p1
            const confidence2 = Math.round((count / productCounts[p2]) * 100);
            const expectedConfidence1 = productCounts[p1] / totalCarts;
            const lift2 = Number(((count / productCounts[p2]) / expectedConfidence1).toFixed(1));

            if (confidence2 >= 30 && lift2 > 1.0) {
                basketAssociations.push({
                    antecedents: [p2],
                    consequents: [p1],
                    confidence: confidence2,
                    support,
                    lift: lift2
                });
            }
        });

        basketAssociations.sort((a, b) => b.confidence - a.confidence);

        // 4. Cohort Retention Matrix
        // Group customers by recruitment month (first order)
        const customerFirstOrderMap: Record<string, Date> = {};
        orders.forEach(o => {
            if (!customerFirstOrderMap[o.customerId]) {
                customerFirstOrderMap[o.customerId] = new Date(o.date);
            } else {
                const existing = customerFirstOrderMap[o.customerId];
                if (new Date(o.date) < existing) {
                    customerFirstOrderMap[o.customerId] = new Date(o.date);
                }
            }
        });

        const cohorts: Record<string, string[]> = {}; // key: "YYYY-MM", value: customerIds
        Object.entries(customerFirstOrderMap).forEach(([cId, date]) => {
            const monthStr = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            if (!cohorts[monthStr]) {
                cohorts[monthStr] = [];
            }
            cohorts[monthStr].push(cId);
        });

        const cohortList = Object.entries(cohorts).map(([cohort, cIds]) => {
            const size = cIds.length;
            const orderMonths = orders.filter(o => cIds.includes(o.customerId)).map(o => ({
                cId: o.customerId,
                month: new Date(o.date)
            }));

            const getRetentionMonth = (monthsOffset: number) => {
                if (size === 0) return null;
                // find unique customers who bought at cohortMonth + offset
                const cohortDate = new Date(orders.find(o => cIds.includes(o.customerId))?.date || now);
                const targetMonthDate = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + monthsOffset, 1);
                
                // If target date is in the future relative to current date, return null
                if (targetMonthDate > now) return null;

                const activeInTarget = new Set(
                    orderMonths
                        .filter(om => om.month.getFullYear() === targetMonthDate.getFullYear() && om.month.getMonth() === targetMonthDate.getMonth())
                        .map(om => om.cId)
                );

                return Math.round((activeInTarget.size / size) * 100);
            };

            return {
                cohort,
                size,
                m0: 100,
                m1: getRetentionMonth(1),
                m2: getRetentionMonth(2),
                m3: getRetentionMonth(3)
            };
        });

        return NextResponse.json({
            status: 'SUCCESS',
            rfmList,
            basketAssociations: basketAssociations.slice(0, 5),
            cohortList
        });
    } catch (error) {
        console.error('AI Analytics GET Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
