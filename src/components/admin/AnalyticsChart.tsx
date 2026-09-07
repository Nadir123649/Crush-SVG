"use client";

import React, { useState } from "react";

interface AnalyticsChartProps {
  data: number[];
  labels: string[];
}

export function AnalyticsChart({ data, labels }: AnalyticsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  // Default mock data if not enough data points
  const chartData = data.length >= 7 ? data : [120, 240, 180, 310, 290, 420, 390];
  const chartLabels = labels.length >= 7 ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (chartContainerRef.current) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
      setMouseY(e.clientY - rect.top);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setMouseY(null);
    setHoverIndex(null);
  };

  // Calculate max for Y-axis scaling (ensure it's at least 10 for small data)
  const maxValue = Math.max(...chartData, 10);
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
      <div
        ref={chartContainerRef}
        className="relative flex-1 flex w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
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

        {/* Vertical dashed line — follows mouse X exactly */}
        {mouseX !== null && hoverIndex !== null && (
          <div
            className="absolute top-[-30px] bottom-[24px] w-[2px] border-l-2 border-dashed border-brand-primary/50 pointer-events-none z-20"
            style={{ left: `${mouseX}px` }}
          />
        )}

        {/* Tooltip — centered on mouse X, floats just above mouse Y */}
        {mouseX !== null && mouseY !== null && hoverIndex !== null && (
          <div
            className="absolute pointer-events-none z-30 flex flex-col items-center"
            style={{
              left: `${mouseX}px`,
              top: `${mouseY - 72}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
              <span className="font-bold text-gray-100 block mb-1 text-center">{chartLabels[hoverIndex]}</span>
              <span className="text-white bg-[#D94A1E] px-2 py-0.5 rounded-full font-medium inline-block mx-auto text-[11px]">
                {chartData[hoverIndex].toLocaleString()} {chartData[hoverIndex] === 1 ? 'conversion' : 'conversions'}
              </span>
            </div>
            {/* Arrow pointing down toward cursor */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
          </div>
        )}

        {/* Bars Container */}
        <div className="relative z-10 flex flex-1 ml-10 pb-[24px] items-end justify-between px-2 sm:px-6">
          {chartData.map((val, i) => {
            const heightPct = (val / yAxisMax) * 100;
            const isHovered = hoverIndex === i;

            return (
              <div
                key={`bar-group-${i}`}
                className="relative flex flex-col items-center justify-end h-full group"
                style={{ width: `${100 / chartData.length}%` }}
                title={`${chartLabels[i]}: ${val} ${val === 1 ? 'conversion' : 'conversions'}`}
              >
                {/* Bar */}
                <div 
                  className="relative w-full max-w-[24px] sm:max-w-[40px] md:max-w-[48px] h-full flex items-end justify-center cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {/* Invisible full-height hover area */}
                  <div className="absolute inset-0 z-20" />

                  {/* The actual colored bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ease-out ${
                      isHovered ? 'bg-[#D94A1E] opacity-100 shadow-md' : 'bg-[#D94A1E]/80 opacity-90'
                    }`}
                    style={{ height: `${heightPct}%`, minHeight: val > 0 ? '4px' : '0' }}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="absolute -bottom-1 translate-y-full text-[#9ca3af] text-[10px] sm:text-xs whitespace-nowrap">
                  {chartLabels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
