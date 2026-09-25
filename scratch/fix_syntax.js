const fs = require('fs');

const files = [
  'leadgen-frontend/src/pages/ProspectDashboard.jsx',
  'leadgen-frontend/src/pages/MasterDashboard.jsx',
  'leadgen-frontend/src/pages/Projects.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // My python script produced things like:
  // value={acceptanceRate.toFixed(1)}%}
  // value={kpiMetrics.linkedin?.acceptanceRate || 0}%}
  // Let's replace value={...}%} with value={`${...}%`}
  
  // Find all instances of value={xxx}%}
  // The regex is: /value=\{([^}]+)\}\%\}/g
  // Wait, if it's value={acceptanceRate.toFixed(1)}%}
  // p1 will be `acceptanceRate.toFixed(1)`
  // replacement: value={`\${$1}%`}
  
  const regex = /value=\{([^}]+)\}\%\}/g;
  let newContent = content.replace(regex, (match, p1) => {
    return 'value={`$' + '{' + p1 + '}%`}';
  });

  // What about value={xxx}% } ?
  const regex2 = /value=\{([^}]+)\}\%\s*\}/g;
  newContent = newContent.replace(regex2, (match, p1) => {
    return 'value={`$' + '{' + p1 + '}%`}';
  });
  
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Fixed syntax error in ' + f);
  }
});
