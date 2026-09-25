const fs = require('fs');
const file = 'leadgen-frontend/src/pages/ProspectDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure import is there
if (!content.includes('KPICard')) {
  const lastImport = content.lastIndexOf('import');
  const insertIndex = content.indexOf('\\n', lastImport) + 1;
  content = content.substring(0, insertIndex) + "import KPICard from '../components/dashboards/KPICard';\\n" + content.substring(insertIndex);
}

// Regex for finding KPI cards
// We want to find: <div className="bg-gradient-to-br ..."> ... </div>
// and replace with <KPICard ... />
// Since HTML regex replacement can be notoriously hard without a parser, let's just use jscodeshift or write a robust script.
// Wait, I can just replace the chunks since they are identical!
