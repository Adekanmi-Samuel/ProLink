const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'src/app/globals.css');
let c = fs.readFileSync(fp, 'utf8');

// Add close button display after the toggle line
const toggleLine = '  .jobs-filters__toggle { display: flex !important; }';
const closeLine = '  .jobs-filters__close { display: block !important; }';

if (!c.includes('jobs-filters__close')) {
  c = c.replace(toggleLine, toggleLine + '\n' + closeLine);
  fs.writeFileSync(fp, c, 'utf8');
  console.log('✅ Added close button CSS');
} else {
  console.log('Close CSS already exists');
}
