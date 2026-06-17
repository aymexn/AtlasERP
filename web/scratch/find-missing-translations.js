const fs = require('fs');
const path = require('path');

const clientCode = fs.readFileSync(path.join(__dirname, '../src/app/[locale]/(app)/dashboard/dashboard-client.tsx'), 'utf8');
const frJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/fr.json'), 'utf8'));

// Extract all t('some_key') or t('some_key.sub_key')
const tRegex = /t\('([^']+)'/g;
let match;
const keysUsed = new Set();

while ((match = tRegex.exec(clientCode)) !== null) {
  keysUsed.add(match[1]);
}

console.log('KEYS USED IN DASHBOARD CLIENT:', Array.from(keysUsed));

console.log('\nCHECKING MISSING KEYS IN fr.json["dashboard"]:');
const dashboardLocales = frJson.dashboard || {};

for (const key of keysUsed) {
  // If the key has dots, it might be nested under dashboard.xxxx
  if (key.includes('.')) {
    const parts = key.split('.');
    let obj = dashboardLocales;
    let missing = false;
    for (const part of parts) {
      if (obj[part] === undefined) {
        missing = true;
        break;
      }
      obj = obj[part];
    }
    if (missing) {
      console.log(`❌ Missing nested key: dashboard.${key} -> (parts: ${parts.join(', ')})`);
    } else {
      console.log(`✅ Nested key exists: dashboard.${key}`);
    }
  } else {
    if (dashboardLocales[key] === undefined) {
      console.log(`❌ Missing key: dashboard.${key}`);
    } else {
      console.log(`✅ Key exists: dashboard.${key}`);
    }
  }
}
