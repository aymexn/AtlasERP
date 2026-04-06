const fs = require('fs');
const path = require('path');

const files = {
    'fr': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\fr.json',
    'en': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\en.json',
    'ar': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\ar.json'
};

const fr_texts = {
    "title": "Ordres de Fabrication",
    "subtitle": "Gérez vos ordres de fabrication et le suivi de production",
    "create_order": "Nouvel OF",
    "reference": "Référence",
    "product": "Produit",
    "planned_qty": "Qté Prévue",
    "status_label": "Statut",
    "date": "Date Prévue",
    "estimated_cost": "Coût Estimé",
    "actual_cost": "Coût Réel",
    "formula": "Formule",
    "output": "Rendement",
    "status": {
        "all": "Tous les statuts",
        "draft": "Brouillon",
        "planned": "Planifié",
        "in_progress": "En Cours",
        "completed": "Terminé",
        "cancelled": "Annulé"
    },
    "prompt_produced_qty": "Entrez la quantité réellement produite:",
    "confirm_start_production": "Êtes-vous sûr de vouloir démarrer la production ? Cela consommera les matières premières en stock.",
    "confirm_cancel": "Êtes-vous sûr de vouloir annuler cet ordre ?",
    "select_product": "Sélectionner un produit...",
    "select_formula": "Sélectionner une formule...",
    "no_active_formula": "Aucune formule active",
    "planned_date": "Date planifiée",
    "generate_requirements": "Générer les Besoins",
    "production_goal": "Objectif de Production",
    "component_lines": "Besoins en Composants",
    "component": "Composant",
    "required": "Requis",
    "consumed": "Consommé",
    "cost": "Coût",
    "stock_status": "Disponibilité",
    "status_enough": "Suffisant",
    "status_low": "Stock Bas",
    "status_insufficient": "Insuffisant",
    "cancel_order": "Annuler l'OF",
    "plan_production": "Planifier",
    "start_production": "Démarrer la Production",
    "complete_production": "Terminer la Production"
};

const en_texts = {
    "title": "Manufacturing Orders",
    "subtitle": "Manage your manufacturing orders and production tracking",
    "create_order": "New MO",
    "reference": "Reference",
    "product": "Product",
    "planned_qty": "Planned Qty",
    "status_label": "Status",
    "date": "Planned Date",
    "estimated_cost": "Estimated Cost",
    "actual_cost": "Actual Cost",
    "formula": "Formula",
    "output": "Output",
    "status": {
        "all": "All statuses",
        "draft": "Draft",
        "planned": "Planned",
        "in_progress": "In Progress",
        "completed": "Completed",
        "cancelled": "Cancelled"
    },
    "prompt_produced_qty": "Enter the actual quantity produced:",
    "confirm_start_production": "Are you sure you want to start production? This will consume raw materials from stock.",
    "confirm_cancel": "Are you sure you want to cancel this order?",
    "select_product": "Select a product...",
    "select_formula": "Select a formula...",
    "no_active_formula": "No active formula",
    "planned_date": "Planned Date",
    "generate_requirements": "Generate Requirements",
    "production_goal": "Production Goal",
    "component_lines": "Component Requirements",
    "component": "Component",
    "required": "Required",
    "consumed": "Consumed",
    "cost": "Cost",
    "stock_status": "Availability",
    "status_enough": "Enough",
    "status_low": "Low Stock",
    "status_insufficient": "Insufficient",
    "cancel_order": "Cancel MO",
    "plan_production": "Plan",
    "start_production": "Start Production",
    "complete_production": "Complete Production"
};

const ar_texts = {
    "title": "أوامر التصنيع",
    "subtitle": "إدارة أوامر التصنيع وتتبع الإنتاج",
    "create_order": "أمر تصنيع جديد",
    "reference": "المرجع",
    "product": "المنتج",
    "planned_qty": "الكمية المخططة",
    "status_label": "الحالة",
    "date": "التاريخ المخطط",
    "estimated_cost": "التكلفة التقديرية",
    "actual_cost": "التكلفة الفعلية",
    "formula": "التركيبة",
    "output": "الإنتاج",
    "status": {
        "all": "جميع الحالات",
        "draft": "مسودة",
        "planned": "مخطط",
        "in_progress": "قيد الإنتاج",
        "completed": "مكتمل",
        "cancelled": "ملغى"
    },
    "prompt_produced_qty": "أدخل الكمية المنتجة الفعلية:",
    "confirm_start_production": "هل أنت متأكد من بدء الإنتاج؟ سيتم استهلاك المواد الخام من المخزون.",
    "confirm_cancel": "هل أنت متأكد من إلغاء هذا الأمر؟",
    "select_product": "اختر منتج...",
    "select_formula": "اختر تركيبة...",
    "no_active_formula": "لا توجد تركيبة نشطة",
    "planned_date": "التاريخ المخطط",
    "generate_requirements": "توليد المتطلبات",
    "production_goal": "هدف الإنتاج",
    "component_lines": "متطلبات المكونات",
    "component": "المكون",
    "required": "مطلوب",
    "consumed": "مستهلك",
    "cost": "التكلفة",
    "stock_status": "التوافر",
    "status_enough": "كافٍ",
    "status_low": "مخزون منخفض",
    "status_insufficient": "غير كافٍ",
    "cancel_order": "إلغاء الأمر",
    "plan_production": "تخطيط",
    "start_production": "بدء الإنتاج",
    "complete_production": "إكمال الإنتاج"
};

const mappings = {
    'fr': fr_texts,
    'en': en_texts,
    'ar': ar_texts
};

for (const [lang, filepath] of Object.entries(files)) {
    if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        data["manufacturing_orders"] = mappings[lang];
        fs.writeFileSync(filepath, JSON.stringify(data, null, 4), 'utf8');
        console.log(`Updated ${lang}.json`);
    }
}
