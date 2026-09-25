import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { standardChartOptions as chartOptions } from '../../utils/chartOptions';

export default function ReportLayout({
  loading,
  title,
  project,
  navigate,
  backUrl,
  fetchData,
  lastUpdated,
  viewMode,
  setViewMode,
  periods,
  charts,
  metrics,
  reportData,
  emptyMessage,
  showTable = true
}) {
  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: { ...chartOptions.scales.x, stacked: true },
      y: { ...chartOptions.scales.y, stacked: true }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  // Get unique sections
  const sections = Array.from(new Set(metrics.map(m => m.section).filter(Boolean)));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(backUrl)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sales Report
            </button>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {viewMode === 'month' ? 'Monthly' : 'Yearly'} {title} - {project?.companyName || 'Project'}
                </h1>
                {project?.website && (
                  <a 
                    href={project.website.startsWith('http') ? project.website : `http://${project.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {project.website}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <p className="text-xs text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'month'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setViewMode('year')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'year'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {periods.length > 0 && charts && charts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {charts.map((chart) => (
              <div key={chart.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
                <div className="h-64">
                  {chart.type === 'line' ? (
                    <Line data={chart.data} options={chart.options || chartOptions} />
                  ) : chart.type === 'bar' ? (
                    <Bar data={chart.data} options={chart.options || barChartOptions} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Table */}
        {periods.length > 0 && showTable && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Key Results
                    </th>
                    {periods.map((period) => (
                      <th key={period} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0 bg-blue-50">
                        <div>{period}</div>
                        <div className="text-xs font-normal text-gray-500 mt-1">Progress</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sections.map((sectionName) => (
                    <React.Fragment key={sectionName}>
                      <tr>
                        <td colSpan={periods.length + 1} className="px-6 py-3 bg-yellow-100 border-b-2 border-yellow-200">
                          <span className="text-sm font-bold text-gray-900">{sectionName}</span>
                        </td>
                      </tr>
                      {metrics.filter(m => m.section === sectionName).map((metric) => (
                        <tr
                          key={metric.key}
                          className={`${
                            metric.highlight
                              ? metric.highlightDark 
                                ? 'bg-green-200' 
                                : 'bg-green-50'
                              : 'hover:bg-gray-50'
                          } transition-colors duration-150`}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 ${
                            metric.bold ? 'font-bold text-gray-900' : 'text-gray-700'
                          } ${metric.highlightDark ? 'bg-green-200' : ''}`}>
                            {metric.label}
                          </td>
                          {periods.map((period) => (
                            <td
                              key={period}
                              className={`px-4 py-4 whitespace-nowrap text-sm text-center border-r border-gray-200 last:border-r-0 ${
                                metric.bold
                                  ? 'font-semibold text-gray-900'
                                  : 'text-gray-700'
                              }`}
                            >
                              {metric.isPercentage 
                                ? `${reportData[period]?.[metric.key] || 0}%`
                                : (reportData[period]?.[metric.key] || 0)
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {/* Case where metrics have no section */}
                  {metrics.filter(m => !m.section).map((metric) => (
                    <tr
                      key={metric.key}
                      className={`${
                        metric.highlight
                          ? metric.highlightDark 
                            ? 'bg-green-200' 
                            : 'bg-green-50'
                          : 'hover:bg-gray-50'
                      } transition-colors duration-150`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 ${
                        metric.bold ? 'font-bold text-gray-900' : 'text-gray-700'
                      } ${metric.highlightDark ? 'bg-green-200' : ''}`}>
                        {metric.label}
                      </td>
                      {periods.map((period) => (
                        <td
                          key={period}
                          className={`px-4 py-4 whitespace-nowrap text-sm text-center border-r border-gray-200 last:border-r-0 ${
                            metric.bold
                              ? 'font-semibold text-gray-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {metric.isPercentage 
                            ? `${reportData[period]?.[metric.key] || 0}%`
                            : (reportData[period]?.[metric.key] || 0)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {periods.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">{emptyMessage || 'No activities found.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
