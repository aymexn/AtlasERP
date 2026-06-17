const fs = require('fs');
const path = require('path');

const locales = ['fr', 'en', 'ar'];

for (const loc of locales) {
  console.log(`\n=== CHECKING ${loc}.json ===`);
  const locJson = JSON.parse(fs.readFileSync(path.join(__dirname, `../messages/${loc}.json`), 'utf8'));
  const dashboard = locJson.dashboard || {};
  
  if (dashboard.units === undefined) {
    console.log(`❌ Missing dashboard.units`);
  } else {
    console.log(`✅ dashboard.units = "${dashboard.units}"`);
  }
  
  if (dashboard.activity_log === undefined) {
    console.log(`❌ Missing dashboard.activity_log`);
  } else {
    console.log(`✅ dashboard.activity_log = "${dashboard.activity_log}"`);
  }
}
