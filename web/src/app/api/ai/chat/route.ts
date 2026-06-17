import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { getGroqChatCompletion } from '@/lib/ai/groq-client';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const withTimeout = async <T>(promise: Promise<T>, ms = 5000, fallback: T): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
};

export async function GET() {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const history = await prisma.aiChatHistory.findMany({
            where: { companyId },
            orderBy: { createdAt: 'asc' },
            take: 50
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error('AI Chat GET Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const body = await request.json();
        const { message, history: requestHistory, userId, locale: bodyLocale } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Detect current locale
        let locale = bodyLocale;
        if (!locale) {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            locale = cookieStore.get('NEXT_LOCALE')?.value;
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

        // 1. Save user message to database
        const userLog = await prisma.aiChatHistory.create({
            data: {
                companyId,
                userId: userId || null,
                role: 'user',
                message: message
            }
        });

        // 2. Hydrate global ERP context
        let useBizDates = false;
        let companyName = "aymenderouiche001's Company";
        let target = 1000000;

        try {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { name: true, settings: true }
            });
            if (company) {
                companyName = company.name;
                useBizDates = company.name === 'Cameleon Colors';
                const settings = company.settings as any;
                if (settings?.monthly_revenue_target) {
                    target = Number(settings.monthly_revenue_target);
                }
            }
        } catch (err) {
            console.error('Failed to fetch company details:', err);
        }

        const now = new Date();
        const currentMonthStart = useBizDates ? new Date('2026-06-01') : startOfMonth(now);
        const currentMonthEnd = useBizDates ? new Date('2026-06-30T23:59:59') : endOfMonth(now);
        const lastMonthStart = useBizDates ? new Date('2026-05-01') : startOfMonth(subMonths(now, 1));
        const lastMonthEnd = useBizDates ? new Date('2026-05-31T23:59:59') : endOfMonth(subMonths(now, 1));

        let treasury = 0;
        let curMonthCA = 0;
        let lastMonthCA = 0;
        let unpaidCount = 0;
        let unpaidTotal = 0;
        let stockAlertsCount = 0;
        let openMOs = 0;
        let pendingPOs = 0;
        let activeClientsCount = 0;
        let productsCount = 0;
        let recentOrdersCount = 0;
        let topClients: { name: string; revenue: number }[] = [];
        let transactions: any[] = [];
        let stockAlertsList: any[] = [];

        try {
            const [
                paymentsSum,
                expensesSum,
                currentMonthSales,
                lastMonthSales,
                unpaidInvoices,
                stockAlertsData,
                topClientsRaw,
                recentPayments,
                recentExpenses,
                openMOsCount,
                pendingPOsCount,
                clientsCount,
                allProductsCount,
                ordersCount
            ] = await Promise.all([
                prisma.payment.aggregate({
                    where: { companyId },
                    _sum: { amount: true }
                }),
                prisma.expense.aggregate({
                    where: { companyId },
                    _sum: { amount: true }
                }),
                prisma.salesOrder.aggregate({
                    where: { companyId, status: { not: 'CANCELLED' }, date: useBizDates ? { gte: currentMonthStart, lte: currentMonthEnd } : { gte: currentMonthStart } },
                    _sum: { totalAmountTtc: true }
                }),
                prisma.salesOrder.aggregate({
                    where: { companyId, status: { not: 'CANCELLED' }, date: useBizDates ? { gte: lastMonthStart, lte: lastMonthEnd } : { gte: lastMonthStart, lte: lastMonthEnd } },
                    _sum: { totalAmountTtc: true }
                }),
                prisma.invoice.findMany({
                    where: { companyId, status: { not: 'PAID' } },
                    select: { id: true, totalAmountTtc: true, amountRemaining: true }
                }),
                prisma.product.findMany({
                    where: { companyId, isActive: true, stockQuantity: { lt: prisma.product.fields.reorderPoint } },
                    select: { name: true, sku: true, stockQuantity: true, reorderPoint: true }
                }),
                prisma.salesOrder.groupBy({
                    by: ['customerId'],
                    where: { companyId, status: { not: 'CANCELLED' } },
                    _sum: { totalAmountTtc: true },
                    orderBy: { _sum: { totalAmountTtc: 'desc' } },
                    take: 5
                }),
                prisma.payment.findMany({
                    where: { companyId },
                    orderBy: useBizDates ? { date: 'desc' } : { createdAt: 'desc' },
                    take: 5,
                    include: { invoice: { select: { reference: true } } }
                }),
                prisma.expense.findMany({
                    where: { companyId },
                    orderBy: useBizDates ? { date: 'desc' } : { createdAt: 'desc' },
                    take: 5
                }),
                prisma.manufacturingOrder.count({
                    where: { companyId, status: { in: ['PLANNED', 'IN_PROGRESS'] } }
                }),
                prisma.purchaseOrder.count({
                    where: { companyId, status: { in: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'] } }
                }),
                prisma.customer.count({
                    where: { companyId, isActive: true }
                }),
                prisma.product.count({
                    where: { companyId, isActive: true }
                }),
                prisma.salesOrder.count({
                    where: { companyId }
                })
            ]);

            treasury = Number(paymentsSum._sum.amount || 0) - Number(expensesSum._sum.amount || 0);
            curMonthCA = Number(currentMonthSales._sum.totalAmountTtc || 0);
            lastMonthCA = Number(lastMonthSales._sum.totalAmountTtc || 0);
            unpaidCount = unpaidInvoices.length;
            unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amountRemaining), 0);
            stockAlertsCount = stockAlertsData.length;
            stockAlertsList = stockAlertsData.map(p => ({ name: p.name, sku: p.sku, stock: Number(p.stockQuantity), threshold: Number(p.reorderPoint) }));
            openMOs = openMOsCount;
            pendingPOs = pendingPOsCount;
            activeClientsCount = clientsCount;
            productsCount = allProductsCount;
            recentOrdersCount = ordersCount;

            const clientIds = topClientsRaw.map(c => c.customerId);
            const clients = await prisma.customer.findMany({
                where: { id: { in: clientIds } },
                select: { id: true, name: true }
            });
            topClients = topClientsRaw.map(c => ({
                name: clients.find(cl => cl.id === c.customerId)?.name || 'Inconnu',
                revenue: Number(c._sum.totalAmountTtc)
            }));

            transactions = [
                ...recentPayments.map(p => ({
                    date: p.date,
                    type: 'Paiement reçu',
                    amount: Number(p.amount),
                    description: `Facture ${p.invoice?.reference || ''}`
                })),
                ...recentExpenses.map(e => ({
                    date: e.date,
                    type: 'Dépense',
                    amount: Number(e.amount),
                    description: e.notes || e.title || e.category || 'Dépense générale'
                }))
            ];
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            transactions = transactions.slice(0, 10);
        } catch (dbError) {
            console.error('AI Context Hydration Safeguard Triggered (using fallback stats):', dbError);
        }

        // 3. System Prompt Hardening
        const systemPromptGuardrails: Record<string, string> = {
            ar: "أنت المنسق الذكي لنظام آيستار AtlasERP. يجب أن تكون جميع تقاريرك، وجداولك، وبطاقات الأداء الخاصة بك باللغة العربية الفصحى حصراً وبأرقام واضحة.",
            fr: "Vous êtes l'ordonnanceur intelligent d'AtlasERP. Toutes vos réponses, cartes KPI et tableaux doivent être rendus en Français formel.",
            en: "You are the intelligent orchestrator of AtlasERP. All responses, metrics, and data grids must be generated in formal English."
        };

        const languagePrompt = `You must strictly match the language of your response to the user's active interface language. The current user interface language is: ${locale}.
System Prompt Guardrail: ${systemPromptGuardrails[locale] || systemPromptGuardrails.fr}
If the locale is 'ar', you must think, format, and generate your entire text stream, metrics overview, tables, and KPI labels exclusively in Arabic (العربية). Do not use French or English technical expressions unless they are non-translatable proper nouns.`;

        const baseSystemPrompt = `You are Atlas AI, the embedded orchestrator for AtlasSuite ERP. You are running inside the workspace of '${companyName}'.
Here is the real-time live data from the database:
- Treasury Balance (payments minus expenses): ${treasury.toLocaleString('fr-DZ')} DA (This is the absolute financial source of truth. Use it consistently).
- Current Monthly Revenue: ${curMonthCA.toLocaleString('fr-DZ')} DA
- Monthly Revenue Target: ${target.toLocaleString('fr-DZ')} DA
- Last Month Revenue: ${lastMonthCA.toLocaleString('fr-DZ')} DA
- Unpaid Invoices count: ${unpaidCount} (Total remaining outstanding: ${unpaidTotal.toLocaleString('fr-DZ')} DA)
- Stock Alerts Count: ${stockAlertsCount}
- Stock Alerts List: ${JSON.stringify(stockAlertsList)}
- Top Clients: ${JSON.stringify(topClients)}
- Last 10 Transactions (payments & expenses): ${JSON.stringify(transactions)}
- Open Manufacturing Orders (MOs): ${openMOs}
- Pending Purchase Orders (POs): ${pendingPOs}
- Active Clients: ${activeClientsCount}
- Catalog Products: ${productsCount}
- Total Sales Orders Count: ${recentOrdersCount}

Never invent placeholder entities. Base your answers solely on this real transaction data from the database. Format all currency values strictly as "X XXX XXX,XX DA" (e.g. 1 700 411,77 DA).

CRITICAL REQUIREMENT:
You MUST respond with a JSON object. The JSON object must have exactly these keys:
{
  "response": "Your markdown answer text here",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
In the "response", use clean markdown (tables, lists, headers, bold text) to present data clearly. Render headers, lists, tables, bold text, and currency blocks styled with Tailwind prose classes.
The "suggestions" must be an array of exactly 3 relevant, context-aware follow-up questions or actions that the user might want to ask next, matching the language of response.`;

        const systemPrompt = `${languagePrompt}\n\n${baseSystemPrompt}`;

        let reply = "";
        let suggestions: string[] = [];

        // Try calling Groq LLM if enabled
        if (process.env.ENABLE_GROQ === 'true') {
            try {
                const groqHistory = requestHistory || [];
                const aiResponse = await getGroqChatCompletion(systemPrompt, groqHistory, message);
                if (aiResponse) {
                    try {
                        const parsed = JSON.parse(aiResponse);
                        reply = parsed.response;
                        suggestions = parsed.suggestions || [];
                    } catch (jsonErr) {
                        console.error('Failed to parse Groq response as JSON:', jsonErr, aiResponse);
                        // If it's not valid JSON, treat it as raw text
                        reply = aiResponse;
                    }
                }
            } catch (err) {
                console.error('Groq LLM call failed, falling back to rules:', err);
            }
        }

        // Rule-based fallback if Groq failed or is disabled
        if (!reply) {
            const suggestionsMap: Record<string, Record<string, string>> = {
                fr: {
                    cash_flow: "Analyser le Cash Flow",
                    stock: "Vérifier Ruptures Stocks",
                    client: "Performance Client",
                    invoices: "Factures en retard",
                    mos: "Ordres de fab. en cours"
                },
                en: {
                    cash_flow: "Analyze Cash Flow",
                    stock: "Check Stock Shortages",
                    client: "Client Performance",
                    invoices: "Overdue Invoices",
                    mos: "Active Manufacturing Orders"
                },
                ar: {
                    cash_flow: "تحليل التدفقات النقدية",
                    stock: "فحص نواقص المخازن",
                    client: "أداء العملاء",
                    invoices: "الفواتير المتأخرة",
                    mos: "أوامر التصنيع الجارية"
                }
            };
            const activeMap = suggestionsMap[locale] || suggestionsMap.fr;
            const promptLower = message.toLowerCase();

            if (locale === 'ar') {
                if (promptLower.includes('client') || promptLower.includes('customer') || promptLower.includes('nour') || promptLower.includes('عميل') || promptLower.includes('زبون')) {
                    reply = `📊 إليك تصنيف أفضل عملائك بناءً على حجم الأعمال الحقيقي لشركة **${companyName}**:\n\n` +
                        `| الترتيب | العميل | رقم الأعمال المحقق (د.ج) |\n` +
                        `| --- | --- | --- |\n` +
                        topClients.map((c, i) => `| **#${i+1}** | ${c.name} | ${c.revenue.toLocaleString('ar-DZ')} د.ج |`).join('\n') + `\n\n` +
                        `يمكنك النقر فوق "قاعدة العملاء" لمزيد من التفاصيل.`;
                    suggestions = [activeMap.cash_flow, activeMap.stock, activeMap.client];
                } else if (promptLower.includes('produit') || promptLower.includes('product') || promptLower.includes('منتج') || promptLower.includes('بضاعة')) {
                    reply = `📦 إليك منتجاتك الرئيسية في المخزون بناءً على الكتالوج الحقيقي الخاص بك:\n\n` +
                        `| رمز المنتج (SKU) | المنتج | المخزون الحالي | السعر |\n` +
                        `| --- | --- | --- | --- |\n` +
                        stockAlertsList.slice(0,5).map(p => `| \`${p.sku}\` | **${p.name}** | ${p.stock} وحدة | - |`).join('\n') + `\n\n` +
                        `هل تريد مني إعداد مسودة طلب شراء لأحد هذه المنتجات؟`;
                    suggestions = [activeMap.cash_flow, activeMap.client, activeMap.invoices];
                } else if (promptLower.includes('trésorerie') || promptLower.includes('ventes') || promptLower.includes('finance') || promptLower.includes('سيولة') || promptLower.includes('نقد') || promptLower.includes('مالية')) {
                    reply = `💰 إليك تقريرًا ماليًا بناءً على البيانات الحقيقية لشركة **${companyName}**:\n\n` +
                        `• السيولة المتوفرة (الخزينة): ${treasury.toLocaleString('ar-DZ')} د.ج\n` +
                        `• رقم الأعمال المحقق لهذا الشهر: ${curMonthCA.toLocaleString('ar-DZ')} د.ج\n` +
                        `• مستحقات العملاء غير المحصلة: ${unpaidTotal.toLocaleString('ar-DZ')} د.ج\n\n` +
                        `| المؤشر | المبلغ (د.ج) |\n` +
                        `| --- | --- |\n` +
                        `| **السيولة المتوفرة (الخزينة)** | ${treasury.toLocaleString('ar-DZ')} د.ج |\n` +
                        `| **رقم الأعمال المحقق** | ${curMonthCA.toLocaleString('ar-DZ')} د.ج |\n` +
                        `| **المستحقات غير المحصلة** | ${unpaidTotal.toLocaleString('ar-DZ')} د.ج |`;
                    suggestions = [activeMap.stock, activeMap.client, activeMap.mos];
                } else {
                    reply = `🤖 مرحبًا! أنا **أطلس الذكاء الاصطناعي**، مساعدك المالي والتشغيلي المدمج في **AtlasSuite ERP** لشركة **${companyName}**.\n\n` +
                        `أنا متصل مباشرة بقاعدة البيانات الحقيقية الخاصة بك (${activeClientsCount} عملاء، ${recentOrdersCount} طلبات، ${productsCount} منتجات).\n\n` +
                        `• السيولة المتوفرة (الخزينة): ${treasury.toLocaleString('ar-DZ')} د.ج\n` +
                        `• رقم الأعمال المحقق لهذا الشهر: ${curMonthCA.toLocaleString('ar-DZ')} د.ج\n` +
                        `• مستحقات العملاء غير المحصلة: ${unpaidTotal.toLocaleString('ar-DZ')} د.ج\n\n` +
                        `إليك بعض الأسئلة الملموسة التي يمكنك طرحها عليّ:\n` +
                        `• *"تحليل التدفقات النقدية لهذا الشهر"* أو *"لخص لي وضع الخزينة."*\n` +
                        `• *"التحقق من خطر نفاد المخزون"* أو *"ما هي المنتجات التي يجب إعادة طلبها؟"*\n` +
                        `• *"من هم أفضل عملائي؟"*`;
                    suggestions = [activeMap.cash_flow, activeMap.stock, activeMap.client];
                }
            } else if (locale === 'en') {
                if (promptLower.includes('client') || promptLower.includes('customer') || promptLower.includes('nour')) {
                    reply = `📊 Here is the ranking of your top customers based on real business volume for **${companyName}**:\n\n` +
                        `| Rank | Customer | Revenue (DA) |\n` +
                        `| --- | --- | --- |\n` +
                        topClients.map((c, i) => `| **#${i+1}** | ${c.name} | ${c.revenue.toLocaleString('en-US')} DA |`).join('\n') + `\n\n` +
                        `You can click on "Customers" in the commercial tab for more details.`;
                    suggestions = [activeMap.cash_flow, activeMap.stock, activeMap.client];
                } else if (promptLower.includes('produit') || promptLower.includes('product') || promptLower.includes('vend')) {
                    reply = `📦 Here are your key products in stock according to your real catalog:\n\n` +
                        `| SKU | Product | Stock Level | Threshold |\n` +
                        `| --- | --- | --- | --- |\n` +
                        stockAlertsList.slice(0,5).map(p => `| \`${p.sku}\` | **${p.name}** | ${p.stock} | ${p.threshold} |`).join('\n') + `\n\n` +
                        `Would you like me to draft a purchase order for one of them?`;
                    suggestions = [activeMap.cash_flow, activeMap.client, activeMap.invoices];
                } else if (promptLower.includes('trésorerie') || promptLower.includes('ventes') || promptLower.includes('finance') || promptLower.includes('cash') || promptLower.includes('flow')) {
                    reply = `💰 Here is a financial summary based on real data for **${companyName}**:\n\n` +
                        `• Treasury Balance: ${treasury.toLocaleString('en-US')} DA\n` +
                        `• Current Month Revenue: ${curMonthCA.toLocaleString('en-US')} DA\n` +
                        `• Outstanding Receivables: ${unpaidTotal.toLocaleString('en-US')} DA\n\n` +
                        `| Indicator | Amount (DA) |\n` +
                        `| --- | --- |\n` +
                        `| **Treasury Balance** | ${treasury.toLocaleString('en-US')} DA |\n` +
                        `| **Current Month Revenue** | ${curMonthCA.toLocaleString('en-US')} DA |\n` +
                        `| **Outstanding Receivables** | ${unpaidTotal.toLocaleString('en-US')} DA |`;
                    suggestions = [activeMap.stock, activeMap.client, activeMap.mos];
                } else {
                    reply = `🤖 Hello! I am **Atlas AI**, the intelligent decision assistant integrated into **AtlasSuite ERP** for **${companyName}**.\n\n` +
                        `I am connected live to your transactional database (${activeClientsCount} active clients, ${recentOrdersCount} orders, ${productsCount} products).\n\n` +
                        `• Treasury Balance: ${treasury.toLocaleString('en-US')} DA\n` +
                        `• Current Month Revenue: ${curMonthCA.toLocaleString('en-US')} DA\n` +
                        `• Outstanding Receivables: ${unpaidTotal.toLocaleString('en-US')} DA\n\n` +
                        `Here are concrete questions you can ask me:\n` +
                        `• *"Analyze this month's cash flow"* or *"Summarize my treasury status."*\n` +
                        `• *"Check stock shortage risks"* or *"Which products need reordering?"*\n` +
                        `• *"Who are my top customers?"*`;
                    suggestions = [activeMap.cash_flow, activeMap.stock, activeMap.client];
                }
            } else {
                // French fallback
                if (promptLower.includes('client') || promptLower.includes('customer') || promptLower.includes('vip') || promptLower.includes('nour')) {
                    reply = `📊 Voici le classement de vos meilleurs clients d'après leur volume d'affaires réel de **${companyName}** :\n\n` +
                        `| Rang | Client | CA Réalisé (DA) |\n` +
                        `| --- | --- | --- |\n` +
                        topClients.map((c, i) => `| **#${i+1}** | ${c.name} | ${c.revenue.toLocaleString('fr-FR')} DA |`).join('\n') + `\n\n` +
                        `Vous pouvez cliquer sur "Fiche Client" dans la barre commerciale pour plus de détails.`;
                    suggestions = [activeMap.cash_flow, activeMap.stock, activeMap.client];
                } else if (promptLower.includes('produit') || promptLower.includes('product') || promptLower.includes('vend')) {
                    reply = `📦 Voici vos produits phares en stock d'après votre catalogue réel :\n\n` +
                        `| SKU | Produit | Stock Actuel | Seuil |\n` +
                        `| --- | --- | --- | --- |\n` +
                        stockAlertsList.slice(0,5).map(p => `| \`${p.sku}\` | **${p.name}** | ${p.stock} | ${p.threshold} |`).join('\n') + `\n\n` +
                        `Souhaitez-vous que je crée un brouillon de bon de commande d'achat pour l'un d'eux ?`;
                    suggestions = [activeMap.cash_flow, activeMap.client, activeMap.invoices];
                } else if (promptLower.includes('trésorerie') || promptLower.includes('ca ') || promptLower.includes('ventes') || promptLower.includes('finance') || promptLower.includes('cash') || promptLower.includes('flow')) {
                    reply = `💰 Voici un point financier basé sur les données réelles de **${companyName}** :\n\n` +
                        `• Solde de trésorerie : ${treasury.toLocaleString('fr-FR')} DA\n` +
                        `• Chiffre d'affaires mensuel : ${curMonthCA.toLocaleString('fr-FR')} DA\n` +
                        `• Encours client restant : ${unpaidTotal.toLocaleString('fr-FR')} DA\n\n` +
                        `| Indicateur | Montant (DA) |\n` +
                        `| --- | --- |\n` +
                        `| **Solde de trésorerie** | ${treasury.toLocaleString('fr-FR')} DA |\n` +
                        `| **Chiffre d'affaires mensuel** | ${curMonthCA.toLocaleString('fr-FR')} DA |\n` +
                        `| **Encours client restant** | ${unpaidTotal.toLocaleString('fr-FR')} DA |`;
                    suggestions = [activeMap.stock, activeMap.client, activeMap.mos];
                } else {
                    reply = `🤖 Bonjour ! Je suis **Atlas AI**, l'assistant décisionnel intelligent intégré à **AtlasSuite ERP** pour **${companyName}**.\n\n` +
                        `Je suis connecté en direct à votre base transactionnelle réelle (${activeClientsCount} clients, ${recentOrdersCount} commandes, ${productsCount} produits).\n\n` +
                        `• Solde de trésorerie : ${treasury.toLocaleString('fr-FR')} DA\n` +
                        `• Chiffre d'affaires mensuel : ${curMonthCA.toLocaleString('fr-FR')} DA\n` +
                        `• Encours client restant : ${unpaidTotal.toLocaleString('fr-FR')} DA\n\n` +
                        `Voici des questions concrètes que vous pouvez me poser :\n` +
                        `• *"Analyser le Cash Flow de ce mois"* ou *"Fais-moi un résumé de ma trésorerie."*\n` +
                        `• *"Vérifier les risques de rupture de stock"* ou *"Quels produits réapprovisionner ?"*\n` +
                        `• *"Qui sont mes meilleurs clients ?"*`;
                    suggestions = [activeMap.cash_flow, activeMap.stock, activeMap.client];
                }
            }
        }

        const erpContextSnapshot = {
            totalCashBalance: treasury,
            pendingMOsCount: openMOs,
            activeStockAlertsCount: stockAlertsCount,
            lowStockProducts: stockAlertsList
        };

        const enrichedContext = {
            systemPrompt,
            erpContextSnapshot
        };

        // 5. Save assistant reply to database
        const assistantLog = await prisma.aiChatHistory.create({
            data: {
                companyId,
                role: 'assistant',
                message: reply,
                context: enrichedContext as any
            }
        });

        return NextResponse.json({
            userMessage: userLog,
            assistantMessage: assistantLog,
            suggestions
        });
    } catch (error) {
        console.error('AI Chat POST Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
