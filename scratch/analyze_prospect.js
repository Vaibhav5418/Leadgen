const fs = require('fs');
const data = JSON.parse(fs.readFileSync('jscpd-report/jscpd-report.json', 'utf8'));
const duplicates = data.duplicates.filter(d => d.firstFile.name.includes('ProspectDashboard.jsx') || d.secondFile.name.includes('ProspectDashboard.jsx')).sort((a,b) => b.lines - a.lines);
console.log(duplicates.slice(0, 10).map(d => `Lines: ${d.lines} | ${d.firstFile.name}:${d.firstFile.start}-${d.firstFile.end} & ${d.secondFile.name}:${d.secondFile.start}-${d.secondFile.end}`).join('\n'));
