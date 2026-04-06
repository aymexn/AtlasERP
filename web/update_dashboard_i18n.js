const fs = require('fs');

const files = {
    'fr': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\fr.json',
    'en': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\en.json',
    'ar': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\ar.json'
};

const dashItems = {
    fr: {
        "production_overview": "Aperçu de la Production",
        "active_orders": "Commandes Actives",
        "planned_orders": "OF Planifiés",
        "in_progress_orders": "OF en Cours",
        "completed_orders": "OF Terminés",
        "estimated_cost": "Coût Prod. Estimé",
        "actual_cost": "Coût Prod. Réel",
        "shortage_alerts": "Alertes de Rupture",
        "urgent_shortages": "Manquants Critiques",
        "produced_goods": "Produits Finis",
        "go_to_production": "Accéder au Centre de Commande",
        "variance": "Écart de Coût"
    },
    en: {
        "production_overview": "Production Overview",
        "active_orders": "Active Orders",
        "planned_orders": "Planned Orders",
        "in_progress_orders": "In Progress",
        "completed_orders": "Completed",
        "estimated_cost": "Est. Production Cost",
        "actual_cost": "Actual Production Cost",
        "shortage_alerts": "Shortage Alerts",
        "urgent_shortages": "Urgent Material Shortages",
        "produced_goods": "Finished Goods Produced",
        "go_to_production": "Go to Command Center",
        "variance": "Cost Variance"
    },
    ar: {
        "production_overview": "نظرة عامة على الإنتاج",
        "active_orders": "الأوامر النشطة",
        "planned_orders": "أوامر مخططة",
        "in_progress_orders": "قيد التنفيذ",
        "completed_orders": "مكتملة",
        "estimated_cost": "تكلفة الإنتاج التقديرية",
        "actual_cost": "تكلفة الإنتاج الفعلية",
        "shortage_alerts": "تنبيهات النقص",
        "urgent_shortages": "نقص المواد العاجل",
        "produced_goods": "المنتجات النهائية",
        "go_to_production": "انتقل إلى مركز القيادة",
        "variance": "تباين التكلفة"
    }
};

for (const [lang, filepath] of Object.entries(files)) {
    if (fs.existsSync(filepath)) {
        let json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        if (!json.dashboard) json.dashboard = {};
        json.dashboard = { ...json.dashboard, ...dashItems[lang] };
        fs.writeFileSync(filepath, JSON.stringify(json, null, 4), 'utf8');
        console.log(`Updated ${lang}.json dashboard keys.`);
    }
}
