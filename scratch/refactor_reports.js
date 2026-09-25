const fs = require('fs');

function refactorReport(file, reportType, chartDefinitions) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Find where `if (loading)` starts
  const loadingIndex = lines.findIndex(l => l.trim() === 'if (loading) {');
  if (loadingIndex === -1) return;

  // Find imports to inject ReportLayout
  let newContent = content;
  if (!content.includes('ReportLayout')) {
    newContent = newContent.replace(
      'import { standardChartOptions as chartOptions } from \'../utils/chartOptions\';',
      'import { standardChartOptions as chartOptions } from \'../utils/chartOptions\';\nimport ReportLayout from \'../components/reports/ReportLayout\';'
    );
  }

  // Slice off everything from `if (loading)`
  const lines2 = newContent.split('\n');
  const li2 = lines2.findIndex(l => l.trim() === 'if (loading) {');
  const beforeLoading = lines2.slice(0, li2).join('\n');

  const backUrl = reportType === 'Monthly' ? "'/master-dashboard'" : "`/projects/${id}/funnel`";

  const replacement = `
  const charts = ${chartDefinitions};

  return (
    <ReportLayout 
      loading={loading}
      title="${reportType} Report"
      project={project}
      navigate={navigate}
      backUrl={${backUrl}}
      fetchData={fetchData}
      lastUpdated={lastUpdated}
      viewMode={viewMode}
      setViewMode={setViewMode}
      periods={periods}
      charts={charts}
      metrics={metrics}
      reportData={reportData}
      emptyMessage="No ${reportType.toLowerCase()} activities found for this project."
    />
  );
}
`;

  fs.writeFileSync(file, beforeLoading + replacement);
}

// 1. Email Report
refactorReport('leadgen-frontend/src/pages/EmailReport.jsx', 'Email', `[
    { id: 'funnel', type: 'line', title: 'Email Funnel', data: chartData.emailFunnel },
    { id: 'breakdown', type: 'bar', title: 'Response Breakdown', data: chartData.responseBreakdown, options: barChartOptions },
    { id: 'pipeline', type: 'bar', title: 'Meeting Pipeline', data: chartData.meetingPipeline, options: barChartOptions },
    { id: 'rate', type: 'line', title: 'Response Rate', data: chartData.responseRate }
  ]`);

// 2. LinkedIn Report
refactorReport('leadgen-frontend/src/pages/LinkedInReport.jsx', 'LinkedIn', `[
    { id: 'funnel', type: 'line', title: 'LinkedIn Funnel', data: chartData.linkedInFunnel },
    { id: 'breakdown', type: 'bar', title: 'Response Breakdown', data: chartData.responseBreakdown, options: barChartOptions },
    { id: 'pipeline', type: 'bar', title: 'Meeting Pipeline', data: chartData.meetingPipeline, options: barChartOptions },
    { id: 'rate', type: 'line', title: 'Response Rate', data: chartData.responseRate }
  ]`);

// 3. Cold Calling Report
refactorReport('leadgen-frontend/src/pages/ColdCallingReport.jsx', 'Cold Calling', `[
    { id: 'funnel', type: 'line', title: 'Calling Funnel', data: chartData.callingFunnel },
    { id: 'outcomes', type: 'bar', title: 'Call Outcomes', data: chartData.callOutcomes, options: barChartOptions },
    { id: 'pipeline', type: 'bar', title: 'Meeting Pipeline', data: chartData.meetingPipeline, options: barChartOptions },
    { id: 'rate', type: 'line', title: 'Connection Rate', data: chartData.connectionRate }
  ]`);

// 4. Monthly Report
// Let's check MonthlyReport.jsx first.
