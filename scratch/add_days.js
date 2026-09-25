const fs = require('fs');
let code = fs.readFileSync('leadgen-frontend/src/hooks/useReportData.js', 'utf8');

const daysLogic = `
  const getDayKey = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const getDays = () => {
    const days = new Set();
    
    activities.forEach(activity => {
      if (activity.createdAt) {
        days.add(getDayKey(activity.createdAt));
      }
    });

    contacts.forEach(contact => {
      if (contact.createdAt) {
        days.add(getDayKey(contact.createdAt));
      }
    });

    return Array.from(days).sort();
  };
`;

if (!code.includes('getDayKey')) {
  code = code.replace('  return {', daysLogic + '\n  return {');
  code = code.replace('    getYears,', '    getYears,\n    getDayKey,\n    getDays,');
  fs.writeFileSync('leadgen-frontend/src/hooks/useReportData.js', code);
  console.log('Added days support');
}
