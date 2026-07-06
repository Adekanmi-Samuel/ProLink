const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(fullPath);
    } else if (/\.(tsx|ts|js)$/.test(entry.name)) {
      fixFile(fullPath);
    }
  }
}

function fixFile(fp) {
  let content = fs.readFileSync(fp, 'utf8');
  // Count raw ₦
  const matches = content.match(/₦/g);
  if (!matches) return;

  const relPath = path.relative(path.resolve(__dirname, '..'), fp);
  console.log(`${relPath}: ${matches.length} ₦ -> &#x20A6;`);
  
  // Replace ₦ with HTML entity &#x20A6; (safe for both JSX and JS strings)
  content = content.split('₦').join('&#x20A6;');
  fs.writeFileSync(fp, content, 'utf8');
}

console.log('Fixing ₦ -> &#x20A6; across all source files...\n');
walk(srcDir);
console.log('\n✅ Done. All Naira signs replaced with HTML entity.');
