const fs = require('fs');
const file = 'leadgen-frontend/src/pages/MasterDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        aspectRatio: 2,
                        layout: {
                          padding: {
                            top: 10,
                            bottom: 10
                          }
                        },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const value = typeof context.parsed.y === 'number' && Number.isFinite(context.parsed.y) 
                                  ? context.parsed.y 
                                  : 0;
                                return \`\${context.label}: \${value.toLocaleString()}\`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => {
                                const numValue = typeof value === 'number' ? value : Number.parseFloat(value);
                                return typeof numValue === 'number' && Number.isFinite(numValue) ? Math.round(numValue) : 0;
                              },
                              stepSize: 1
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            },
                            ticks: {
                              maxRotation: 45,
                              minRotation: 45,
                              font: {
                                size: 10
                              }
                            }
                          }
                        }
                      }}`;

const varDef = `
  const commonFunnelChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    layout: {
      padding: { top: 10, bottom: 10 }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = typeof context.parsed.y === 'number' && Number.isFinite(context.parsed.y) ? context.parsed.y : 0;
            return \`\${context.label}: \${value.toLocaleString()}\`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            const numValue = typeof value === 'number' ? value : Number.parseFloat(value);
            return typeof numValue === 'number' && Number.isFinite(numValue) ? Math.round(numValue) : 0;
          },
          stepSize: 1
        }
      },
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } }
      }
    }
  };
`;

const insertPos = content.indexOf('return (');
content = content.substring(0, insertPos) + varDef + '\n  ' + content.substring(insertPos);

let count = 0;
while (content.includes(targetStr)) {
  content = content.replace(targetStr, '                      options={commonFunnelChartOptions}');
  count++;
}
console.log('Replaced', count, 'instances in MasterDashboard');
fs.writeFileSync(file, content);
