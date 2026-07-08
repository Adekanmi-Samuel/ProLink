const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'prolink-frontend', 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix implicit required props in AnimatedComponents by setting them to : any
  if (file.endsWith('AnimatedComponents.tsx') || file.endsWith('AnimatedPage.tsx')) {
    content = content.replace(/export function ([A-Za-z0-9_]+)\(\{(.*?)\}\)/g, 'export function $1({$2}: any)');
  }

  // Fix framer motion ease array type errors
  content = content.replace(/ease:\s*\[([0-9.\s]+),([0-9.\s]+),([0-9.\s]+),([0-9.\s]+)\](?! as)/g, 'ease: [$1, $2, $3, $4] as any');
  content = content.replace(/ease:\s*\[([0-9.\s]+),([0-9.\s]+),([0-9.\s]+),([0-9.\s]+)\] as const/g, 'ease: [$1, $2, $3, $4] as any');

  // There are some stagger component missing props
  content = content.replace(/export function ([A-Za-z0-9_]+)\(\{(.*?)\}\)/g, (match, p1, p2) => {
    if (!p2.includes(':') && (file.includes('Section') || file.includes('Landing'))) {
      return `export function ${p1}({${p2}}: any)`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
});
