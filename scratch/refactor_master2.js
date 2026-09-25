const fs = require('fs');
const file = 'leadgen-frontend/src/pages/MasterDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /options=\{\{\s*responsive: true,\s*maintainAspectRatio: true,\s*aspectRatio: 2,\s*layout: \{\s*padding: \{\s*top: 10,\s*bottom: 10\s*\}\s*\},\s*plugins: \{\s*legend: \{ display: false \},\s*tooltip: \{\s*callbacks: \{\s*label: \(context\) => \{\s*const value = typeof context\.parsed\.y === 'number' && Number\.isFinite\(context\.parsed\.y\)\s*\?\s*context\.parsed\.y\s*:\s*0;\s*return `\$\{context\.label\}: \$\{value\.toLocaleString\(\)\}`;?\s*\}\s*\}\s*\}\s*\},\s*scales: \{\s*y: \{\s*beginAtZero: true,\s*ticks: \{\s*callback: \(value\) => \{\s*const numValue = typeof value === 'number' \? value : Number\.parseFloat\(value\);\s*return typeof numValue === 'number' && Number\.isFinite\(numValue\) \? Math\.round\(numValue\) : 0;\s*\},\s*stepSize: 1\s*\}\s*\},\s*x: \{\s*grid: \{\s*display: false\s*\},\s*ticks: \{\s*maxRotation: 45,\s*minRotation: 45,\s*font: \{\s*size: 10\s*\}\s*\}\s*\}\s*\}\s*\}\}/gm;

const matches = content.match(regex);
console.log('Matches found:', matches ? matches.length : 0);

if (matches && matches.length > 0) {
  content = content.replace(regex, 'options={commonFunnelChartOptions}');
  fs.writeFileSync(file, content);
  console.log('Replaced all matches');
}
