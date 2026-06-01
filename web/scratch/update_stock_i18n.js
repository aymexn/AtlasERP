const fs = require('fs');

const frPath = 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\fr.json';
const enPath = 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\en.json';
const arPath = 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\ar.json';

const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

frData.inventory.stock.export_pdf = "Exporter l'Inventaire (PDF)";
enData.inventory.stock.export_pdf = "Export Inventory (PDF)";
arData.inventory.stock.export_pdf = "تصدير المخزون (PDF)";

frData.inventory.stock.cost_undefined = "Coût non défini";
enData.inventory.stock.cost_undefined = "Cost undefined";
arData.inventory.stock.cost_undefined = "التكلفة غير محددة";

frData.inventory.stock.priority_actions = "Actions prioritaires requises";
enData.inventory.stock.priority_actions = "Priority actions required";
arData.inventory.stock.priority_actions = "إجراءات ذات أولوية مطلوبة";

fs.writeFileSync(frPath, JSON.stringify(frData, null, 4), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arData, null, 4), 'utf8');

console.log("Successfully updated stock translations!");
