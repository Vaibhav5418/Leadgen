import React from 'react';

export default function KPIButton({
  onClick,
  isActive,
  gradientClass,
  activeBorderClass,
  activeRingClass,
  inactiveBorderClass,
  iconColorClass,
  badgeColorClass,
  badgeText,
  value,
  subtext,
  iconSvg
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradientClass} rounded-lg border shadow-sm p-2.5 transition-all hover:shadow-md cursor-pointer ${
        isActive 
          ? `${activeBorderClass} ring-2 ${activeRingClass}` 
          : inactiveBorderClass
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className={`w-7 h-7 rounded-lg bg-white/80 border ${inactiveBorderClass} flex items-center justify-center`}>
          {iconSvg}
        </div>
        <span className={`text-xs font-semibold ${badgeColorClass} bg-white/70 border ${inactiveBorderClass} px-2 py-1 rounded-full`}>
          {badgeText}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{subtext}</div>
    </button>
  );
}
