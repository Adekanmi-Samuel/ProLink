const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

const refactorFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Add `next` to async (req, res) or async(req, res) or async function(req, res)
  content = content.replace(/(async\s+(?:function\s*)?(?:\w+\s*=[\s\n]*)?\(\s*req\s*,\s*res\s*)\)/g, '$1, next)');

  // 2. Replace console.error(err) and res.status(500)... with next(err)
  const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{([\s\S]*?)\}/g;
  
  content = content.replace(catchRegex, (match, errVar, catchBody) => {
    let newBody = catchBody.replace(/console\.error\([^)]+\);?\s*/g, '');
    newBody = newBody.replace(/return\s+res\.status\(500\)\.(?:json|send)\([^)]+\);?/g, `return next(${errVar});`);
    newBody = newBody.replace(/res\.status\(500\)\.(?:json|send)\([^)]+\);?/g, `next(${errVar});`);
    return `catch (${errVar}) {${newBody}}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored: ${path.basename(filePath)}`);
  }
};

const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
for (const file of files) {
  refactorFile(path.join(controllersDir, file));
}
console.log('Done refactoring errors.');
