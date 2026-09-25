const fs = require('fs');
const data = JSON.parse(fs.readFileSync('jscpd-report/jscpd-report.json', 'utf8'));
const duplicates = data.duplicates.sort((a,b) => b.lines - a.lines);
console.log(duplicates.slice(0, 15).map(d => `Lines: ${d.lines} | File 1: ${d.firstFile.name}:${d.firstFile.start}-${d.firstFile.end} | File 2: ${d.secondFile.name}:${d.secondFile.start}-${d.secondFile.end}`).join('\n'));
