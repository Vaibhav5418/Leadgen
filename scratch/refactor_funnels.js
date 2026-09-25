const fs = require('fs');

function replaceLines(file, startLine, replacementLines) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const newLines = [...lines.slice(0, startLine - 1), ...replacementLines];
  fs.writeFileSync(file, newLines.join('\n'));
}

const emailFunnel = 'leadgen-frontend/src/pages/EmailFunnelDetail.jsx';
replaceLines(emailFunnel, 175, [
  '  return (',
  '    <FunnelLayout ',
  '      loading={loading}',
  '      title="Email Funnel"',
  '      project={project}',
  '      navigate={navigate}',
  '      id={id}',
  '      funnelData={funnelData}',
  '      funnelRows={funnelRows}',
  '    />',
  '  );',
  '}'
]);

const linkedinFunnel = 'leadgen-frontend/src/pages/LinkedInFunnelDetail.jsx';
const liLines = fs.readFileSync(linkedinFunnel, 'utf8').split('\n');
// Find the line where "if (loading)" starts
const liIndex = liLines.findIndex(l => l.trim() === 'if (loading) {');
if (liIndex !== -1) {
  replaceLines(linkedinFunnel, liIndex + 1, [
    '  return (',
    '    <FunnelLayout ',
    '      loading={loading}',
    '      title="LinkedIn Funnel"',
    '      project={project}',
    '      navigate={navigate}',
    '      id={id}',
    '      funnelData={funnelData}',
    '      funnelRows={funnelRows}',
    '    />',
    '  );',
    '}'
  ]);
}

const ccFunnel = 'leadgen-frontend/src/pages/ColdCallingFunnelDetail.jsx';
if (fs.existsSync(ccFunnel)) {
  const ccLines = fs.readFileSync(ccFunnel, 'utf8').split('\n');
  const ccIndex = ccLines.findIndex(l => l.trim() === 'if (loading) {');
  if (ccIndex !== -1) {
    replaceLines(ccFunnel, ccIndex + 1, [
      '  return (',
      '    <FunnelLayout ',
      '      loading={loading}',
      '      title="Cold Calling Funnel"',
      '      project={project}',
      '      navigate={navigate}',
      '      id={id}',
      '      funnelData={funnelData}',
      '      funnelRows={funnelRows}',
      '    />',
      '  );',
      '}'
    ]);
  }
}
