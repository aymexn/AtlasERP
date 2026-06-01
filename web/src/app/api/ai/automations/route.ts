import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        // Retrieve existing automations
        let automations = await prisma.aiAutomation.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });

        // Seed default automations if none exist
        if (automations.length === 0) {
            const defaults = [
                {
                    companyId,
                    name: 'Réapprovisionnement Automatique',
                    description: 'Déclenche la création automatique d\'un bon de commande fournisseur (BCF) dès qu\'un produit descend en dessous de son stock d\'alerte.',
                    type: 'stock_reorder',
                    triggerConditions: { metric: 'stockQuantity', operator: 'lt', thresholdField: 'reorderPoint' },
                    actions: { actionType: 'create_purchase_order', autoSend: false },
                    isActive: true,
                    stats: { executionCount: 12, successRate: 100, timeSavedHours: 4, impactValue: 0 }
                },
                {
                    companyId,
                    name: 'Relances Paiement Intelligentes',
                    description: 'Envoie un e-mail de relance poli et personnalisé aux clients ayant des factures en retard de plus de 15 jours.',
                    type: 'payment_reminder',
                    triggerConditions: { daysOverdue: 15, invoiceStatus: 'UNPAID' },
                    actions: { actionType: 'send_email_reminder', templateId: 'polite_warning' },
                    isActive: true,
                    stats: { executionCount: 45, successRate: 51, recoveredAmount: 18200 }
                },
                {
                    companyId,
                    name: 'Détection Opportunités Cross-sell',
                    description: 'Suggère des produits complémentaires (Vernis Marin après Peinture Acrylique) lors de la création d\'une commande.',
                    type: 'cross_sell',
                    triggerConditions: { confidenceScoreThreshold: 75 },
                    actions: { actionType: 'suggest_items_on_so_edit' },
                    isActive: false,
                    stats: { estimatedMonthlyRevenue: 12450 }
                }
            ];

            await prisma.aiAutomation.createMany({
                data: defaults
            });

            automations = await prisma.aiAutomation.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' }
            });
        }

        return NextResponse.json(automations);
    } catch (error) {
        console.error('AI Automations GET Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const body = await request.json();
        const { name, description, type, triggerConditions, actions } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 });
        }

        const newAutomation = await prisma.aiAutomation.create({
            data: {
                companyId,
                name,
                description,
                type,
                triggerConditions: triggerConditions || {},
                actions: actions || {},
                isActive: true,
                stats: { executionCount: 0 }
            }
        });

        return NextResponse.json(newAutomation);
    } catch (error) {
        console.error('AI Automations POST Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
