const fs = require('fs');

const files = {
    'fr': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\fr.json',
    'en': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\en.json',
    'ar': 'c:\\Users\\LENOVO\\Desktop\\AtlasERP\\web\\messages\\ar.json'
};

const navItems = {
    fr: { "manufacturing": "Fabrication" },
    en: { "manufacturing": "Manufacturing" },
    ar: { "manufacturing": "التصنيع" }
};

for (const [lang, filepath] of Object.entries(files)) {
    if (fs.existsSync(filepath)) {
        let json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        if (!json.nav) json.nav = {};
        json.nav = { ...json.nav, ...navItems[lang] };
        fs.writeFileSync(filepath, JSON.stringify(json, null, 4), 'utf8');
        console.log(`Updated ${lang}.json navigation keys.`);
    }
}
