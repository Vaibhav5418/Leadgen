const fs = require('fs');
const files = ['leadgen-frontend/src/pages/ProspectDashboard.jsx', 'leadgen-frontend/src/pages/MasterDashboard.jsx', 'leadgen-frontend/src/pages/Projects.jsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content.replace(/value=\{\\([0-9.]+)%\\\}/g, (match, p1) => {
    return 'value={`' + p1 + '%`}';
  });
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Fixed ' + f);
  }
});
