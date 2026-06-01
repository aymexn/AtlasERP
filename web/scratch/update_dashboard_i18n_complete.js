const fs = require('fs');

const frPath = 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\fr.json';
const enPath = 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\en.json';
const arPath = 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\ar.json';

const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Update chat.attach_tooltip
frData.chat.attach_tooltip = "Attacher la fiche de l'OF";
enData.chat.attach_tooltip = "Attach MO sheet";
arData.chat.attach_tooltip = "إرفاق ملف أمر التصنيع";

// Define complete dashboard namespace
frData.dashboard = {
    ...frData.dashboard,
    "title": "Tableau de Bord",
    "actions": {
        "recalculate": "RECALCULER LES DONNÉES"
    },
    "sections": {
        "today_overview": "APERÇU AUJOURD'HUI"
    },
    "metrics": {
        "monthly_goal": "OBJECTIF MENSUEL",
        "monthly_revenue": "CHIFFRE D'AFFAIRES MENSUEL",
        "cash_on_hand": "TRÉSORERIE EN CAISSE",
        "company_health": "SANTÉ DE L'ENTREPRISE",
        "stable_month": "→ Stable ce mois-ci",
        "achieved": "Atteint",
        "remaining": "Reste",
        "in_cash": "en caisse",
        "out_of_stock": "articles en rupture",
        "optimal_level": "Niveau optimal",
        "action_required": "Action requise",
        "orders_this_month": "commande(s) ce mois",
        "active_customers_label": "{count} client(s) actif(s)",
        "month_over_month": "Mois après Mois",
        "vs_last_month": "{percent}% vs mois dernier",
        "stable_vs_last_month": "Stable vs mois dernier",
        "plus_100_vs_last_month": "+100% vs mois dernier",
        "insufficient_history": "Historique insuffisant",
        "insufficient_history_desc": "Pas encore assez de données historiques. Revenez après quelques mois d'activité.",
        "articles_in_alert": "{count} Articles en alerte",
        "all_stocks_optimal": "Tous les stocks sont à un niveau optimal.",
        "orders_count": "{count} Commandes",
        "recovery_rate_label": "Taux de recouvrement",
        "view_profile": "Voir Profil",
        "view_all": "Tout voir",
        "no_activity": "Aucune activité récente détectée",
        "top_suppliers_volume": "Top Fournisseurs (Volume)",
        "cash_tooltip": "Liquidités disponibles comparées à hier",
        "stock_tooltip": "Articles en rupture de stock nécessitant réapprovisionnement",
        "sales_tooltip": "Commandes clients actives",
        "customers_tooltip": "Nouveaux clients ajoutés ce mois",
        "cash_increase_vs_yesterday": "↗ +15.0% vs hier",
        "total_active_label": "Total Actifs",
        "new_this_month_label": "Nouveaux ce mois",
        "top_customer_label": "🏆 Top Client",
        "last_order_label": "Dernière cmd",
        "collected_cash": "Encaisse",
        "customers_and_sales": "Clients & Ventes"
    },
    "quick_actions": {
        "title": "Actions Rapides",
        "sale": "Vente",
        "purchase": "Achat",
        "manufacturing": "Fabrication",
        "invoice": "Facture",
        "customer": "Client",
        "stock": "Stock",
        "tasks": "Tâches"
    },
    "gauge": {
        "excellent": "EXCELLENT",
        "good": "BON",
        "warning": "ATTENTION",
        "critical": "CRITIQUE"
    }
};

enData.dashboard = {
    ...enData.dashboard,
    "title": "Dashboard",
    "actions": {
        "recalculate": "RECALCULATE DATA"
    },
    "sections": {
        "today_overview": "TODAY'S OVERVIEW"
    },
    "metrics": {
        "monthly_goal": "MONTHLY GOAL",
        "monthly_revenue": "MONTHLY REVENUE",
        "cash_on_hand": "CASH ON HAND",
        "company_health": "COMPANY HEALTH",
        "stable_month": "→ Stable this month",
        "achieved": "Achieved",
        "remaining": "Remaining",
        "in_cash": "cash in hand",
        "out_of_stock": "out of stock items",
        "optimal_level": "Optimal level",
        "action_required": "Action required",
        "orders_this_month": "order(s) this month",
        "active_customers_label": "{count} active customer(s)",
        "month_over_month": "Month over Month",
        "vs_last_month": "{percent}% vs last month",
        "stable_vs_last_month": "Stable vs last month",
        "plus_100_vs_last_month": "+100% vs last month",
        "insufficient_history": "Insufficient history",
        "insufficient_history_desc": "Not enough historical data yet. Check back after a few months of activity.",
        "articles_in_alert": "{count} Items in alert",
        "all_stocks_optimal": "All stock levels are optimal.",
        "orders_count": "{count} Orders",
        "recovery_rate_label": "Recovery rate",
        "view_profile": "View Profile",
        "view_all": "View all",
        "no_activity": "No recent activity detected",
        "top_suppliers_volume": "Top Suppliers (Volume)",
        "cash_tooltip": "Available liquidity compared to yesterday",
        "stock_tooltip": "Out of stock items requiring replenishment",
        "sales_tooltip": "Active sales orders",
        "customers_tooltip": "New customers added this month",
        "cash_increase_vs_yesterday": "↗ +15.0% vs yesterday",
        "total_active_label": "Total Active",
        "new_this_month_label": "New this month",
        "top_customer_label": "🏆 Top Customer",
        "last_order_label": "Last order",
        "collected_cash": "Collected",
        "customers_and_sales": "Customers & Sales"
    },
    "quick_actions": {
        "title": "Quick Actions",
        "sale": "Sale",
        "purchase": "Purchase",
        "manufacturing": "Manufacturing",
        "invoice": "Invoice",
        "customer": "Customer",
        "stock": "Stock",
        "tasks": "Tasks"
    },
    "gauge": {
        "excellent": "EXCELLENT",
        "good": "GOOD",
        "warning": "WARNING",
        "critical": "CRITICAL"
    }
};

arData.dashboard = {
    ...arData.dashboard,
    "title": "لوحة القيادة",
    "actions": {
        "recalculate": "إعادة حساب البيانات"
    },
    "sections": {
        "today_overview": "نظرة عامة اليوم"
    },
    "metrics": {
        "monthly_goal": "الهدف الشهري",
        "monthly_revenue": "المبيعات الشهرية",
        "cash_on_hand": "الخزينة النقدية",
        "company_health": "صحة الشركة",
        "stable_month": "← مستقر هذا الشهر",
        "achieved": "المحقق",
        "remaining": "المتبقي",
        "in_cash": "في الخزينة",
        "out_of_stock": "سلع غير متوفرة",
        "optimal_level": "مستوى ممتاز",
        "action_required": "مطلوب إجراء",
        "orders_this_month": "طلبات هذا الشهر",
        "active_customers_label": "{count} عميل نشط",
        "month_over_month": "شهرًا بعد شهر",
        "vs_last_month": "{percent}% مقارنة بالشهر الماضي",
        "stable_vs_last_month": "مستقر مقارنة بالشهر الماضي",
        "plus_100_vs_last_month": "+100% مقارنة بالشهر الماضي",
        "insufficient_history": "بيانات غير كافية",
        "insufficient_history_desc": "لا توجد بيانات تاريخية كافية بعد. يرجى العودة بعد بضعة أشهر من النشاط.",
        "articles_in_alert": "{count} منتجات في حالة تنبيه",
        "all_stocks_optimal": "جميع مستويات المخزون ممتازة.",
        "orders_count": "{count} طلبات",
        "recovery_rate_label": "معدل التحصيل",
        "view_profile": "عرض الملف",
        "view_all": "عرض الكل",
        "no_activity": "لم يتم رصد أي نشاط حديث",
        "top_suppliers_volume": "أهم الموردين (الحجم)",
        "cash_tooltip": "السيولة المتاحة مقارنة بيوم أمس",
        "stock_tooltip": "منتجات غير متوفرة تتطلب إعادة التموين",
        "sales_tooltip": "طلبات العملاء النشطة",
        "customers_tooltip": "العملاء الجدد المضافون هذا الشهر",
        "cash_increase_vs_yesterday": "↗ +15.0% مقارنة بأمس",
        "total_active_label": "إجمالي النشطين",
        "new_this_month_label": "الجدد هذا الشهر",
        "top_customer_label": "🏆 أفضل عميل",
        "last_order_label": "آخر طلب",
        "collected_cash": "المحصل",
        "customers_and_sales": "العملاء والمبيعات"
    },
    "quick_actions": {
        "title": "إجراءات سريعة",
        "sale": "بيع",
        "purchase": "شراء",
        "manufacturing": "تصنيع",
        "invoice": "فاتورة",
        "customer": "عميل",
        "stock": "مخزون",
        "tasks": "مهام"
    },
    "gauge": {
        "excellent": "ممتاز",
        "good": "جيد",
        "warning": "انتباه",
        "critical": "حرِج"
    }
};

fs.writeFileSync(frPath, JSON.stringify(frData, null, 4), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arData, null, 4), 'utf8');

console.log("Successfully updated all dictionary json files!");
