/**
 * AtlasERP i18n Key Extractor
 * Scans all TSX/TS files and extracts translation key references.
 * Compares against fr.json to find missing keys.
 */

const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.join(__dirname, '..');
const MESSAGES_DIR = path.join(WEB_ROOT, 'messages');
const SCAN_DIRS = [
    path.join(WEB_ROOT, 'src', 'app'),
    path.join(WEB_ROOT, 'src', 'components')
];
const OUTPUT_FILE = path.join(__dirname, 'missing-keys-report.txt');

// Load fr.json as flat map
function flattenJSON(obj, prefix = '') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            Object.assign(out, flattenJSON(v, key));
        } else {
            out[key] = v;
        }
    }
    return out;
}

const frJson = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'fr.json'), 'utf-8'));
const existingKeys = flattenJSON(frJson);

// Recursively find all .tsx and .ts files
function findFiles(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findFiles(full, results);
        } else if (entry.isFile() && /\.(tsx?|js)$/.test(entry.name)) {
            results.push(full);
        }
    }
    return results;
}

const allFiles = [];
for (const dir of SCAN_DIRS) {
    findFiles(dir, allFiles);
}

// Extract namespace + keys per file
const missingKeys = new Set();
const foundKeys = new Set();

for (const file of allFiles) {
    const src = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(WEB_ROOT, file);

    // Find all useTranslations calls to get namespaces used in this file
    // e.g. const t = useTranslations('inventory') or const ct = useTranslations('common')
    const nsMap = {}; // varName -> namespace
    const nsRegex = /const\s+(\w+)\s*=\s*useTranslations\(['"`]([^'"`]+)['"`]\)/g;
    let m;
    while ((m = nsRegex.exec(src)) !== null) {
        nsMap[m[1]] = m[2];
    }

    // Also handle: useTranslations('ns') without assignment (inline or as prop)
    const inlineNsRegex = /useTranslations\(['"`]([^'"`]+)['"`]\)/g;
    while ((m = inlineNsRegex.exec(src)) !== null) {
        // already captured above via nsMap, skip
    }

    // Find all t('key') calls for each known translation var
    for (const [varName, ns] of Object.entries(nsMap)) {
        // Match t('key') t("key") t(`key`) - literal string only
        const tRegex = new RegExp(`\\b${varName}\\(['"\`]([^'"\`#]+)['"\`]`, 'g');
        while ((m = tRegex.exec(src)) !== null) {
            const key = m[1];
            // Skip keys with {interpolation} markers that aren't real keys
            if (key.includes('{') || key.includes('}')) continue;
            const fullKey = `${ns}.${key}`;
            foundKeys.add(fullKey);
            if (!existingKeys.hasOwnProperty(fullKey)) {
                missingKeys.add(`MISSING: ${fullKey}  [in ${relPath}]`);
            }
        }

        // Detect dynamic keys: t(`status.${...}`) or t('prefix.' + ...)
        const dynamicRegex = new RegExp(`\\b${varName}\\((['"\`][^'"\`]*['"\`]\\s*\\+|[\`][^\`]*\\$\\{)`, 'g');
        while ((m = dynamicRegex.exec(src)) !== null) {
            missingKeys.add(`DYNAMIC (Verify Manually): ${ns}.[dynamic]  [in ${relPath}]`);
        }
    }
}

// Write report
const lines = ['=== AtlasERP i18n Missing Keys Report ===', `Generated: ${new Date().toISOString()}`, ''];

if (missingKeys.size === 0) {
    lines.push('✅ ZERO MISSING KEYS - All translation keys are present in fr.json');
} else {
    lines.push(`❌ ${missingKeys.size} missing key(s) found:\n`);
    for (const line of [...missingKeys].sort()) {
        lines.push(line);
    }
}

fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8');
console.log(lines.join('\n'));
