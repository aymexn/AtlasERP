import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { getGroqExplanation } from '@/lib/ai/groq-client';

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        // Detect current locale
        const url = new URL(request.url);
        let locale = url.searchParams.get('locale');
        
        if (!locale) {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            locale = cookieStore.get('NEXT_LOCALE')?.value || null;
        }
        if (!locale) {
            const acceptLang = request.headers.get('accept-language');
            if (acceptLang) {
                const primary = acceptLang.split(',')[0].split('-')[0];
                if (['fr', 'en', 'ar'].includes(primary)) {
                    locale = primary;
                }
            }
        }
        if (!locale) {
            locale = 'fr';
        }

        const recommendations = [];

        // 1. Rupture de stock (Reorder Suggestion)
        const lowStock = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                stockQuantity: { lte: prisma.product.fields.reorderPoint }
            },
            select: { id: true, name: true, stockQuantity: true, reorderPoint: true, salePriceHt: true },
            take: 3
        });

        if (lowStock.length > 0) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const orderLines = await prisma.salesOrderLine.findMany({
                where: {
                    productId: lowStock[0].id,
                    salesOrder: {
                        companyId,
                        date: { gte: thirtyDaysAgo },
                        status: { not: 'CANCELLED' }
                    }
                },
                select: { quantity: true }
            });

            const totalSold30Days = orderLines.reduce((sum, line) => sum + Number(line.quantity), 0);
            const weeklyVelocity = Math.ceil(totalSold30Days / 4);

            const stockQty = Number(lowStock[0].stockQuantity || 0);
            const reorderPt = Number(lowStock[0].reorderPoint || 0);
            const price = Number(lowStock[0].salePriceHt || 0);
            const estimatedLoss = price * (weeklyVelocity || 5);

            // Multilingual setup for stock reorder
            const titles: Record<string, string> = {
                fr: 'Rupture de stock imminente',
                en: 'Imminent stock shortage',
                ar: 'نفاد مخزون وشيك'
            };
            const subtitles: Record<string, string> = {
                fr: `${lowStock.length} produit(s) en dessous de leur point de commande`,
                en: `${lowStock.length} product(s) below their reorder point`,
                ar: `${lowStock.length} منتج(ات) أقل من حد إعادة الطلب`
            };
            const recActions: Record<string, string> = {
                fr: `Commander des unités de ${lowStock[0].name} immédiatement`,
                en: `Order units of ${lowStock[0].name} immediately`,
                ar: `طلب وحدات من ${lowStock[0].name} فوراً`
            };
            const actionLabels: Record<string, string> = {
                fr: 'Créer BCF automatiquement',
                en: 'Create PO automatically',
                ar: 'إنشاء طلب شراء تلقائياً'
            };

            const analyses: Record<string, string[]> = {
                fr: [
                    `Ventes moyennes estimées: ${weeklyVelocity} unités/semaine`,
                    `Stock actuel: ${stockQty} unités (point de commande: ${reorderPt})`,
                    `Délai d'approvisionnement estimé: 7 jours`,
                    `Perte potentielle de CA: ${estimatedLoss.toLocaleString('fr-FR')} DA`
                ],
                en: [
                    `Estimated average sales: ${weeklyVelocity} units/week`,
                    `Current stock: ${stockQty} units (reorder point: ${reorderPt})`,
                    `Estimated lead time: 7 days`,
                    `Potential revenue loss: ${estimatedLoss.toLocaleString('en-US')} DA`
                ],
                ar: [
                    `المبيعات المتوسطة المقدرة: ${weeklyVelocity} وحدة/أسبوع`,
                    `المخزون الحالي: ${stockQty} وحدة (حد إعادة الطلب: ${reorderPt})`,
                    `مدة التوريد المقدرة: 7 أيام`,
                    `خسارة المبيعات المحتملة: ${estimatedLoss.toLocaleString('ar-DZ')} د.ج`
                ]
            };

            const systemPromptInstructs: Record<string, string> = {
                fr: `Rédige un résumé court (2 phrases maximum) pour un responsable commercial, en français, qui :
- Indique l'urgence (dans combien de jours la rupture surviendra)
- Mentionne la perte financière concrète
- Termine par une action claire (ex: "Commandez 50 unités immédiatement.")`,
                en: `Write a short summary (2 sentences maximum) for a sales manager, in formal English, which:
- Indicates the urgency (how many days until stock runs out)
- Mentions the concrete financial loss
- Ends with a clear action (e.g., "Order 50 units immediately.")`,
                ar: `اكتب ملخصًا قصيرًا (جملتين كحد أقصى) لمدير مبيعات باللغة العربية الفصحى، والذي:
- يوضح مدى الاستعجال (في كم يوم سيحدث النفاد)
- يذكر الخسارة المالية الملموسة
- ينتهي بإجراء واضح (مثال: "اطلب 50 وحدة فوراً.")`
            };

            const stockPrompt = `Situation context:
Product: ${lowStock[0].name}
Current stock: ${stockQty} units (reorder point: ${reorderPt})
Average sales: ${weeklyVelocity} units/week
Replenishment time: 7 days
Estimated loss: ${estimatedLoss} DA

Instructions:
${systemPromptInstructs[locale] || systemPromptInstructs.fr}

Be direct and punchy without technical jargon.`;

            const impactValues: Record<string, string> = {
                fr: `-${estimatedLoss.toLocaleString('fr-FR')} DA`,
                en: `-${estimatedLoss.toLocaleString('en-US')} DA`,
                ar: `-${estimatedLoss.toLocaleString('ar-DZ')} د.ج`
            };

            recommendations.push({
                id: 'rec-stock-reorder',
                priority: 'critical',
                impact: impactValues[locale] || impactValues.fr,
                title: titles[locale] || titles.fr,
                subtitle: subtitles[locale] || subtitles.fr,
                analysis: analyses[locale] || analyses.fr,
                recommendedAction: recActions[locale] || recActions.fr,
                actionLabel: actionLabels[locale] || actionLabels.fr,
                prompt: stockPrompt
            });
        }

        // 2. Relance clients inactifs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const inactiveCustomers = await prisma.customer.findMany({
            where: {
                companyId,
                isActive: true,
                salesOrders: {
                    some: {},
                    none: {
                        date: { gte: thirtyDaysAgo }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                totalRevenue: true
            },
            take: 3
        });

        if (inactiveCustomers.length > 0) {
            const customerNames = inactiveCustomers.map(c => c.name).join(', ');
            const totalRevenue = inactiveCustomers.reduce((sum, c) => sum + Number(c.totalRevenue || 0), 0);
            const potentialGain = Math.round(totalRevenue * 0.1);

            const titles: Record<string, string> = {
                fr: 'Relance clients inactifs',
                en: 'Reactivate inactive customers',
                ar: 'إعادة تنشيط العملاء غير النشطين'
            };
            const subtitles: Record<string, string> = {
                fr: `${inactiveCustomers.length} client(s) n'ont pas commandé depuis 30+ jours`,
                en: `${inactiveCustomers.length} customer(s) have not ordered for 30+ days`,
                ar: `${inactiveCustomers.length} زبون لم يطلبوا منذ أكثر من 30 يوماً`
            };
            const recActions: Record<string, string> = {
                fr: 'Envoyer une relance par e-mail ou passer un appel de suivi',
                en: 'Send an email reminder or perform a follow-up call',
                ar: 'إرسال تذكير بالبريد الإلكتروني أو إجراء مكالمة متابعة'
            };
            const actionLabels: Record<string, string> = {
                fr: 'Initier la campagne',
                en: 'Start campaign',
                ar: 'بدء الحملة'
            };

            const analyses: Record<string, string[]> = {
                fr: [
                    `Clients concernés: ${customerNames}`,
                    `Chiffre d'affaires historique total de ces clients: ${totalRevenue.toLocaleString('fr-FR')} DA`,
                    `Taux moyen de succès de campagne estimé: 15%`
                ],
                en: [
                    `Concerned customers: ${customerNames}`,
                    `Total historical revenue of these customers: ${totalRevenue.toLocaleString('en-US')} DA`,
                    `Estimated average campaign success rate: 15%`
                ],
                ar: [
                    `العملاء المعنيون: ${customerNames}`,
                    `إجمالي رقم الأعمال التاريخي لهؤلاء العملاء: ${totalRevenue.toLocaleString('ar-DZ')} د.ج`,
                    `معدل نجاح الحملة المتوسط المقدر: 15%`
                ]
            };

            const systemPromptInstructs: Record<string, string> = {
                fr: `Rédige un résumé court (2 phrases maximum) en français, ton persuasif, qui :
- Rappelle le risque de perdre ce client
- Suggère une action concrète (email, remise, appel)
- Mentionne le gain potentiel si réactivé (estimé à ${potentialGain} DA).`,
                en: `Write a short summary (2 sentences maximum) in English, with a persuasive tone, which:
- Reminds of the risk of losing this customer
- Suggests a concrete action (email, discount, call)
- Mentions the potential gain if reactivated (estimated at ${potentialGain} DA).`,
                ar: `اكتب ملخصًا قصيرًا (جملتين كحد أقصى) باللغة العربية، بنبرة مقنعة، والذي:
- يذكر بخطر فقدان هذا العميل
- يقترح إجراءً ملموساً (بريد إلكتروني، خصم، اتصال)
- يذكر المكاسب المحتملة في حال إعادة النشاط (المقدرة بـ ${potentialGain} د.ج).`
            };

            const churnPrompt = `Situation context:
Customer: ${inactiveCustomers[0].name} (typically orders every 30 days)
Last order: 45 days ago
Average cart value: ${Math.round(Number(inactiveCustomers[0].totalRevenue || 0) / 3 || 15000)} DA
Risk of churn: High

Instructions:
${systemPromptInstructs[locale] || systemPromptInstructs.fr}`;

            const impactValues: Record<string, string> = {
                fr: `+${potentialGain.toLocaleString('fr-FR')} DA`,
                en: `+${potentialGain.toLocaleString('en-US')} DA`,
                ar: `+${potentialGain.toLocaleString('ar-DZ')} د.ج`
            };

            recommendations.push({
                id: 'rec-client-reactivate',
                priority: 'high',
                impact: impactValues[locale] || impactValues.fr,
                title: titles[locale] || titles.fr,
                subtitle: subtitles[locale] || subtitles.fr,
                analysis: analyses[locale] || analyses.fr,
                recommendedAction: recActions[locale] || recActions.fr,
                actionLabel: actionLabels[locale] || actionLabels.fr,
                prompt: churnPrompt
            });
        }

        // 3. Factures en retard (Payment terms optimization)
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: { in: ['SENT', 'OVERDUE', 'PARTIAL'] as any },
                dueDate: { lt: new Date() }
            },
            select: {
                reference: true,
                amountRemaining: true,
                customer: {
                    select: { name: true }
                }
            },
            take: 3
        });

        if (overdueInvoices.length > 0) {
            const totalOutstanding = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amountRemaining || 0), 0);
            const customerNames = Array.from(new Set(overdueInvoices.map(i => i.customer.name))).join(', ');

            const titles: Record<string, string> = {
                fr: 'Factures en retard de paiement',
                en: 'Overdue invoices',
                ar: 'فواتير متأخرة السداد'
            };
            const subtitles: Record<string, string> = {
                fr: `${overdueInvoices.length} facture(s) dépassent leur date d'échéance`,
                en: `${overdueInvoices.length} invoice(s) exceed their due date`,
                ar: `${overdueInvoices.length} فاتورة (فواتير) تجاوزت تاريخ الاستحقاق`
            };
            const recActions: Record<string, string> = {
                fr: 'Envoyer un rappel de paiement ou proposer un règlement échelonné.',
                en: 'Send a payment reminder or propose a payment schedule.',
                ar: 'إرسال تذكير بالدفع أو اقتراح جدول سداد.'
            };
            const actionLabels: Record<string, string> = {
                fr: 'Générer relances de paiement',
                en: 'Generate payment reminders',
                ar: 'توليد تذكيرات الدفع'
            };

            const analyses: Record<string, string[]> = {
                fr: [
                    `Créances en souffrance: ${totalOutstanding.toLocaleString('fr-FR')} DA`,
                    `Clients concernés: ${customerNames}`,
                    `Des relances ciblées réduiront votre besoin en fonds de roulement.`
                ],
                en: [
                    `Overdue accounts receivable: ${totalOutstanding.toLocaleString('en-US')} DA`,
                    `Concerned customers: ${customerNames}`,
                    `Targeted follow-ups will reduce your working capital requirement.`
                ],
                ar: [
                    `مستحقات معلقة: ${totalOutstanding.toLocaleString('ar-DZ')} د.ج`,
                    `العملاء المعنيون: ${customerNames}`,
                    `ستقلل التذكيرات المستهدفة من متطلبات رأس المال العامل لديك.`
                ]
            };

            const systemPromptInstructs: Record<string, string> = {
                fr: `Rédige un résumé court (2 phrases maximum) en français, ton professionnel et direct, qui :
- Alerte sur le montant total bloqué en retard
- Suggère une action immédiate (ex: envoyer un rappel amiable ou proposer un échéancier)
- Explique l'impact sur le besoin en fonds de roulement.`,
                en: `Write a short summary (2 sentences maximum) in English, with a professional and direct tone, which:
- Alerts on the total amount blocked in delay
- Suggests an immediate action (e.g., send a friendly reminder or propose a schedule)
- Explains the impact on the working capital requirement.`,
                ar: `اكتب ملخصًا قصيرًا (جملتين كحد أقصى) باللغة العربية، بنبرة مهنية ومباشرة، والذي:
- ينبه إلى المبلغ الإجمالي المعلق بسبب التأخير
- يقترح إجراءً فورياً (مثل: إرسال تذكير ودي أو اقتراح جدول زمني)
- يوضح الأثر على متطلبات رأس المال العامل.`
            };

            const paymentPrompt = `Situation context:
Concerned customers: ${customerNames}
Total outstanding: ${totalOutstanding} DA

Instructions:
${systemPromptInstructs[locale] || systemPromptInstructs.fr}`;

            const impactValues: Record<string, string> = {
                fr: `Trésorerie +${Math.round(totalOutstanding).toLocaleString('fr-FR')} DA`,
                en: `Cash +${Math.round(totalOutstanding).toLocaleString('en-US')} DA`,
                ar: `السيولة +${Math.round(totalOutstanding).toLocaleString('ar-DZ')} د.ج`
            };

            recommendations.push({
                id: 'rec-payment-terms',
                priority: 'medium',
                impact: impactValues[locale] || impactValues.fr,
                title: titles[locale] || titles.fr,
                subtitle: subtitles[locale] || subtitles.fr,
                analysis: analyses[locale] || analyses.fr,
                recommendedAction: recActions[locale] || recActions.fr,
                actionLabel: actionLabels[locale] || actionLabels.fr,
                prompt: paymentPrompt
            });
        }

        // Enrich with Groq LLM predictions/explanations in parallel (non-blocking)
        const enrichedRecommendations = await Promise.all(
            recommendations.map(async (rec) => {
                const { prompt, ...rest } = rec;
                if (prompt) {
                    try {
                        const aiSummary = await getGroqExplanation(prompt);
                        return {
                            ...rest,
                            aiSummary: aiSummary || undefined
                        };
                    } catch (err) {
                        console.error(`Error generating Groq explanation for ${rec.id}:`, err);
                        return rest;
                    }
                }
                return rest;
            })
        );

        return NextResponse.json(enrichedRecommendations);
    } catch (error) {
        console.error('AI Recommendations GET Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
