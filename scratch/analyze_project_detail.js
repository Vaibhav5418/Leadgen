const fs = require('fs');
const data = JSON.parse(fs.readFileSync('jscpd-report/jscpd-report.json', 'utf8'));
const duplicates = data.duplicates.filter(d => d.firstFile.name.includes('ProjectDetail') && d.secondFile.name.includes('ProjectDetail')).sort((a,b) => b.lines - a.lines);
console.log(duplicates.slice(0, 15).map(d => `Lines: ${d.lines} | ${d.firstFile.start}-${d.firstFile.end} & ${d.secondFile.start}-${d.secondFile.end}`).join('\n'));
