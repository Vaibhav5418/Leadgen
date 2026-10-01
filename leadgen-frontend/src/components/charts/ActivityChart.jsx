import { createElement, Suspense } from 'react';

export default function ActivityChart({ title, hasData, data, options, chartComponent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {hasData ? (
        <div className="h-64">
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div></div>}>
            {createElement(chartComponent, { data, options })}
          </Suspense>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p className="text-sm">No activity data available</p>
        </div>
      )}
    </div>
  );
}
