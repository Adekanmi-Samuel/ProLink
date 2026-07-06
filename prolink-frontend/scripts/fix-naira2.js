const fs = require('fs');
const path = require('path');
const srcDir = path.resolve(__dirname, '../src');

// Track which files to handle
const TSX_JSX_FILES = new Set([
  'src/app/dashboard/contracts/[id]/page.tsx',
  'src/app/dashboard/contracts/page.tsx',
  'src/app/dashboard/my-bids/page.tsx',
  'src/app/dashboard/wallet/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/jobs/new/page.tsx',
  'src/app/jobs/[id]/page.tsx',
  'src/app/jobs/page.tsx',
  'src/app/page.tsx',
  'src/app/profile/edit/page.tsx',
  'src/app/talent/page.tsx',
  'src/components/MilestonesSection.tsx',
]);

const JS_FILES = new Set([
  'src/lib/format.js',
]);

let changed = 0;

for (const [relPath, isJSFile] of [
  ...Array.from(TSX_JSX_FILES).map(f => [f, false]),
  ...Array.from(JS_FILES).map(f => [f, true]),
]) {
  const fp = path.resolve(srcDir, '..', relPath);
  if (!fs.existsSync(fp)) {
    console.log(`File not found: ${relPath}`);
    continue;
  }
  let content = fs.readFileSync(fp, 'utf8');
  if (!content.includes('₦')) continue;

  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    if (!line.includes('₦')) {
      newLines.push(line);
      continue;
    }

    // Determine if this line's ₦ are inside template literals (backtick strings)
    // or in JSX text content
    if (isJSFile) {
      // Pure JS file — use \u20A6 escape
      newLines.push(line.replace(/₦/g, '\\u20A6'));
    } else {
      // TSX/JSX file — need to check context
      // Simple heuristic: if we're inside backtick template literals, use \u20A6
      // Otherwise use {'\u20A6'} for JSX expressions or &#x20A6; for JSX text
      
      // Count backticks before this position to know if inside template literal
      const backtickCount = (content.substring(0, 0)).split('`').length - 1;
      const inTemplate = backtickCount % 2 === 1;
      
      // Check for template literal pattern: `...₦${...}`
      if (line.includes('`') && /\u20A3?/.test(line) && /\$\{/.test(line)) {
        // This line has template literals — safe to use \u20A6
        newLines.push(line.replace(/₦/g, '\\u20A6'));
      } else {
        // JSX text content — use &#x20A6; (HTML entity works in JSX)
        // Actually no, use {'\u20A6'} for consistency
        // Actually, &#x20A6; is the simplest and works directly in JSX
        newLines.push(line.replace(/₦/g, '&#x20A6;'));
      }
    }
  }

  const newContent = newLines.join('\n');
  fs.writeFileSync(fp, newContent, 'utf8');
  console.log(`Fixed: ${relPath}`);
  changed++;
}

console.log(`\nDone. Fixed ${changed} files.`);
