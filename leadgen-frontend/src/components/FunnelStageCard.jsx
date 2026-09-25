import React from 'react';

export default function FunnelStageCard({
  row,
  index,
  actualWidth,
  bgGradient,
  borderColor,
  shadowColor,
  iconBg,
  textColor,
  icon,
  value,
  maxValue,
  percentage,
  isLast
}) {
  return (
    <div
      key={row.key}
      className="w-full flex flex-col items-center transition-all duration-700 ease-out"
      style={{
        animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s both`
      }}
    >
      <div
        className={`relative bg-gradient-to-r ${bgGradient} ${borderColor} border rounded-md shadow-md ${shadowColor} hover:shadow-lg transition-all duration-500 transform hover:scale-[1.01] hover:-translate-y-0.5 group overflow-hidden`}
        style={{
          width: `${actualWidth}%`,
          minWidth: '150px',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        {/* Content */}
        <div className="relative px-3 py-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className={`${iconBg} backdrop-blur-sm rounded p-1 shadow-sm`}>
                <span className="text-sm">{icon}</span>
              </div>
              <div>
                <span className={`${textColor} text-[10px] font-bold uppercase tracking-wide block leading-tight`}>
                  {row.label}
                </span>
                <span className={`${textColor} text-[9px] opacity-80 mt-0 block`}>
                  {row.description}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className={`${textColor} text-lg font-extrabold mb-0 drop-shadow-lg`}>
                {value.toLocaleString()}
              </div>
              {index > 0 && maxValue > 0 && (
                <div className={`${textColor} text-[9px] font-semibold bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/30`}>
                  {percentage.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Progress bar */}
          {index > 0 && (
            <div className="mt-1 h-0.5 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-white/80 to-white rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ 
                  width: `${Math.min(percentage, 100)}%`,
                  animation: `progressFill 1.5s ease-out ${index * 0.1 + 0.5}s both`
                }}
              />
            </div>
          )}
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
      
      {/* Enhanced Connector line */}
      {!isLast && (
        <div className="relative my-0.5">
          <div className="w-0.5 h-2 bg-gradient-to-b from-gray-400 via-gray-500 to-gray-400 rounded-full shadow-inner mx-auto"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-500 rounded-full shadow-sm"></div>
        </div>
      )}
    </div>
  );
}
