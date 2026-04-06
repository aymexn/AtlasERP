const fs = require('fs');

const files = {
    'fr': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\fr.json',
    'en': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\en.json',
    'ar': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\ar.json'
};

const opsItems = {
    fr: {
        "ops_cockpit": "Cockpit des Opérations",
        "readiness": "Disponibilité",
        "shortage_impact": "Impact Rupture",
        "production_value": "Valeur Production",
        "alerts": "Alertes Opérationnelles",
        "missing_formula_alert": "{count} produits n'ont pas de formule active",
        "total_shortages_alert": "{count} ordres ont des composants manquants",
        "ready_to_start": "Prêt à démarrer",
        "needs_attention": "Attention requise",
        "stock_status": "État Stock",
        "cost_variance": "Écart Coût",
        "efficiency": "Efficacité"
    },
    en: {
        "ops_cockpit": "Operations Cockpit",
        "readiness": "Readiness",
        "shortage_impact": "Shortage Impact",
        "production_value": "Production Value",
        "alerts": "Operational Alerts",
        "missing_formula_alert": "{count} products are missing active formulas",
        "total_shortages_alert": "{count} orders have material shortages",
        "ready_to_start": "Ready to start",
        "needs_attention": "Needs attention",
        "stock_status": "Stock Status",
        "cost_variance": "Cost Variance",
        "efficiency": "Efficiency"
    },
    ar: {
        "ops_cockpit": "لوحة عمليات الإنتاج",
        "readiness": "الجاهزية",
        "shortage_impact": "أثر النقص",
        "production_value": "قيمة الإنتاج",
        "alerts": "تنبيهات تشغيلية",
        "missing_formula_alert": "{count} من المنتجات تفتقر إلى صيغ نشطة",
        "total_shortages_alert": "{count} من الطلبات لديها نقص في المكونات",
        "ready_to_start": "جاهز للبدء",
        "needs_attention": "بحاجة للاهتمام",
        "stock_status": "حالة المخزون",
        "cost_variance": "تباين التكلفة",
        "efficiency": "الكفاءة"
    }
};

for (const [lang, filepath] of Object.entries(files)) {
    if (fs.existsSync(filepath)) {
        let json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        if (!json.manufacturing_orders) json.manufacturing_orders = {};
        json.manufacturing_orders = { ...json.manufacturing_orders, ...opsItems[lang] };
        fs.writeFileSync(filepath, JSON.stringify(json, null, 4), 'utf8');
        console.log(`Updated ${lang}.json manufacturing_orders keys.`);
    }
}
