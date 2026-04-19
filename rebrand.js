const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /emerald-600/g, replace: 'primary' },
  { search: /emerald-500/g, replace: 'primary' },
  { search: /emerald-50/g, replace: 'blue-50/50' },
  { search: /emerald-100/g, replace: 'blue-100/50' },
  { search: /emerald-700/g, replace: 'blue-700' },
  { search: /emerald-400/g, replace: 'blue-400' },
  { search: /emerald-900/g, replace: 'slate-900' },
  { search: /green-600/g, replace: 'primary' },
  { search: /teal-600/g, replace: 'primary' }
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      replacements.forEach(r => {
        if (r.search.test(content)) {
          content = content.replace(r.search, r.replace);
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
}

const targetDir = path.join(process.cwd(), 'web', 'src');
console.log(`Starting rebranding in: ${targetDir}`);
walk(targetDir);
console.log('Finished rebranding.');
