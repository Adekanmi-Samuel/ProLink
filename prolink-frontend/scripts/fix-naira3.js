const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const files = [
  'src/app/page.tsx',
  'src/components/MilestonesSection.tsx',
];

for (const rel of files) {
  const fp = path.join(root, rel);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Replace corrupted â-¦ (UTF-8 misinterpreted as Latin-1) with HTML entity
  content = content.replace(/â/g, '').replace(/‚/g, '').replace(/¦/g, '');
  // Actually the above is wrong. Let me just replace the exact corrupted byte sequence
  
  // The corrupted â-¦ bytes are:
  // â = 0xE2, ‚ = 0x82, ¦ = 0xA6  (Latin-1 interpretation of UTF-8 for U+20A6)
  // We need to replace these with &#x20A6;
  
  // Using regex on the literal characters
  content = content.replace(/â\\x82\\xA6/g, '&#x20A6;');
  
  // Simpler: just look for the pattern of consecutive corrupted chars
  content = content.replace(/â€š/g, '&#x20A6;');
  
  // Actually let me just check what bytes we have
  const bytes = Buffer.from(content, 'utf8');
  console.log(`${rel}: initial bytes around position where ₦ should be...`);
  
  // Find and replace the naira corruption pattern
  // The â-¦ sequence in UTF-8: E2 82 A6 (these ARE the correct UTF-8 bytes for U+20A6!)
  // When displayed in Latin-1: â (E2) ‚ (82) ¦ (A6)
  // But when read properly as UTF-8, it IS the Naira sign!
  
  // Wait... this is important. If the file has bytes E2 82 A6, that IS the UTF-8
  // encoding of U+20A6 (₦). The issue was ONLY that the browser wasn't being told
  // to use UTF-8 encoding. With the charset meta tag fix, these bytes should render
  // correctly as ₦.
  
  // BUT if the browser is still showing â-¦, then either:
  // 1. The charset fix hasn't deployed yet
  // 2. The source file doesn't actually have the right bytes
  
  // Let me check what bytes are actually at the badge line
  const idx = content.indexOf('Milestone');
  console.log(`  Found at byte offset ${idx}`);
  if (idx >= 0) {
    const badgeSlice = content.slice(idx, idx + 50);
    console.log(`  Content: ${badgeSlice}`);
    console.log(`  Hex: ${Buffer.from(badgeSlice, 'utf8').toString('hex')}`);
  }
  
  // Replace the raw ₦ with HTML entity or \u20A6
  content = content.split('₦').join('&#x20A6;');
  
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`Fixed: ${rel}`);
}
