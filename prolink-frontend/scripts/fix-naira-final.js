const fs = require('fs');
const path = require('path');
const root = __dirname.replace(/scripts$/, '');

// Fix page.tsx line 60: "Milestone Funded ???" -> "Milestone Funded &#x20A6;150k &#x2713;"
let p1 = path.join(root, 'src/app/page.tsx');
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(
  /Milestone Funded[^<]*<\/div>/,
  'Milestone Funded &#x20A6;150k &#x2713;</div>'
);
fs.writeFileSync(p1, c1, 'utf8');
console.log('Fixed page.tsx');

let p2 = path.join(root, 'src/components/MilestonesSection.tsx');
let c2 = fs.readFileSync(p2, 'utf8');

// Fix: placeholder="Amount ()" -> placeholder="Amount (&#x20A6;)"
c2 = c2.replace(
  'placeholder="Amount ()"',
  'placeholder="Amount (&#x20A6;)"'
);

// Fix: <span className="stage-card__amount">{Number(m.amount).toLocaleString()}</span>
// -> <span className="stage-card__amount">&#x20A6;{Number(m.amount).toLocaleString()}</span>
c2 = c2.replace(
  '<span className="stage-card__amount">{Number(m.amount).toLocaleString()}</span>',
  '<span className="stage-card__amount">&#x20A6;{Number(m.amount).toLocaleString()}</span>'
);

// Fix corrupted bullet €¢ -> actual bullet or dot
c2 = c2.replace(
  /€¢/g,
  '\u00B7'
);

fs.writeFileSync(p2, c2, 'utf8');
console.log('Fixed MilestonesSection.tsx');

console.log('Done');
