"use client";

import React, { useState } from "react";

interface AnalyticsChartProps {
  data: number[];
  labels: string[];
}

export function AnalyticsChart({ data, labels }: AnalyticsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Default mock data if not enough data points
  const chartData = data.length >= 7 ? data : [120, 240, 180, 310, 290, 420, 390];
  const chartLabels = labels.length >= 7 ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Calculate max for Y-axis scaling (ensure it's at least 10 for small data)
  const maxValue = Math.max(...chartData, 10);
  // Round up to nearest nice number for the top grid line (e.g. 100, 500, 1000)
  const getNiceMax = (val: number) => {
    if (val === 0) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
    const firstDigit = val / magnitude;
    let niceDigit;
    if (firstDigit <= 1) niceDigit = 1;
    else if (firstDigit <= 2) niceDigit = 2;
    else if (firstDigit <= 5) niceDigit = 5;
    else niceDigit = 10;
    return niceDigit * magnitude;
  };
  const yAxisMax = getNiceMax(maxValue);

  // 5 grid lines (0%, 25%, 50%, 75%, 100%)
  const yAxisLines = [4, 3, 2, 1, 0].map(i => (yAxisMax * i) / 4);

  return (
    <div className="relative w-full h-full flex flex-col pt-4">
      {/* Chart Area */}
      <div className="relative flex-1 flex w-full">
        {/* Y-Axis Labels & Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[24px]">
          {yAxisLines.map((val, i) => (
            <div key={`grid-${i}`} className="relative flex items-center w-full h-[1px]">
              <span className="absolute left-0 text-[#9ca3af] text-[10px] md:text-xs text-right w-8 -translate-y-1/2">
                {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}
              </span>
              <div className="ml-10 w-full border-b border-dashed border-gray-200 dark:border-gray-800" />
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="relative z-10 flex flex-1 ml-10 pb-[24px] items-end justify-between px-2 sm:px-6">
          {chartData.map((val, i) => {
            const heightPercentage = `${(val / yAxisMax) * 100}%`;
            const isHovered = hoverIndex === i;
            
            return (
              <div 
                key={`bar-group-${i}`}
                className="relative flex flex-col items-center justify-end h-full group"
                style={{ width: `${100 / chartData.length}%` }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Bar */}
                <div className="relative w-full max-w-[24px] sm:max-w-[40px] md:max-w-[48px] h-full flex items-end justify-center cursor-pointer">
                  {/* Invisible hover area that spans full height */}
                  <div className="absolute inset-0 z-20" />
                  
                  {/* The actual colored bar */}
                  <div 
                    className={`w-full rounded-t-md transition-all duration-300 ease-out ${
                      isHovered ? 'bg-[#D94A1E] opacity-100 shadow-md' : 'bg-[#D94A1E]/80 opacity-90'
                    }`}
                    style={{ height: heightPercentage, minHeight: val > 0 ? '4px' : '0' }}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="absolute -bottom-1 translate-y-full text-[#9ca3af] text-[10px] sm:text-xs whitespace-nowrap">
                  {chartLabels[i]}
                </span>

                {/* Tooltip */}
                <div 
                  className={`absolute bottom-full mb-3 z-30 transition-all duration-200 pointer-events-none flex flex-col items-center ${
                    isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    <span className="font-bold text-gray-100 block mb-1 text-center">{chartLabels[i]}</span>
                    <span className="text-white bg-[#D94A1E] px-2 py-0.5 rounded-full font-medium inline-block mx-auto text-[11px]">
                      {val.toLocaleString()} {val === 1 ? 'conversion' : 'conversions'}
                    </span>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
