import React from 'react';

export default function KPICard({
  gradientClass,
  borderColorClass,
  iconColorClass,
  badgeColorClass,
  badgeText,
  value,
  subtext,
  iconSvg,
  subtitle
}) {
  return (
    <div className={`bg-gradient-to-br ${gradientClass} rounded-xl border ${borderColorClass} shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-lg bg-white/80 border ${borderColorClass} flex items-center justify-center shadow-xs`}>
          {iconSvg}
        </div>
        <span className={`text-xs font-semibold ${badgeColorClass} bg-white/70 border ${borderColorClass} px-2 py-1 rounded-full shadow-xs`}>
          {badgeText}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 leading-tight">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{subtext}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
}
