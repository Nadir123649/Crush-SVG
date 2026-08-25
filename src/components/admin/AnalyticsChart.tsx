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

  const maxVal = Math.max(...chartData, 100);
  const minVal = 0;
  
  // Create path using percentage coordinates (0 to 100) instead of absolute pixels
  // This allows the SVG path to stretch responsively without skewing HTML labels
  const width = 100;
  const height = 100;
  
  // Padding percentages to leave room for Y-axis text inside SVG area
  const padLeft = 8;
  const padRight = 2;
  const padTop = 10;
  const padBottom = 15; // Leave room at bottom for HTML labels
  
  const usableWidth = width - padLeft - padRight;
  const usableHeight = height - padTop - padBottom;
  
  const stepX = usableWidth / (chartData.length - 1);
  
  const points = chartData.map((val, i) => {
    const x = padLeft + i * stepX;
    const y = padTop + usableHeight - ((val - minVal) / (maxVal - minVal)) * usableHeight;
    return { x, y, val, label: chartLabels[i] };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const fillPathD = `${pathD} L${points[points.length - 1].x},${height - padBottom} L${points[0].x},${height - padBottom} Z`;

  return (
    <div className="relative w-full h-[300px] md:h-[400px]">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#D94A1E" stopOpacity="0.3"></stop>
            <stop offset="100%" stopColor="#D94A1E" stopOpacity="0.0"></stop>
          </linearGradient>
        </defs>
        
        {/* Grid lines (using SVG text for Y-axis is okay because it anchors to the left and scales predictably if we keep X small) */}
        {/* But actually, for perfect scaling, even Y-axis is better as HTML. 
            However, we can just use SVG for grid lines and let them stretch horizontally. */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padTop + usableHeight * ratio;
          const val = Math.round(maxVal - (maxVal * ratio));
          return (
            <g key={`grid-${i}`}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#f3f4f6" strokeWidth="0.2" strokeDasharray="1 1" />
            </g>
          );
        })}

        {/* Path area */}
        <path d={fillPathD} fill="url(#chartGradient)" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke="#D94A1E" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover Points - Only drawing circles, text moved to HTML */}
        {points.map((p, i) => (
          <g 
            key={`point-${i}`} 
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Invisible large circle for easier hovering */}
            <circle cx={p.x} cy={p.y} r="5" fill="transparent" />
            
            {/* Visible small circle */}
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={hoverIndex === i ? "1.5" : "0.8"} 
              fill="#fff" 
              stroke="#D94A1E" 
              strokeWidth="0.4" 
            />
          </g>
        ))}
      </svg>
      
      {/* HTML Y-Axis Labels (Absolutely positioned so they don't stretch) */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padTop + usableHeight * ratio;
          const val = Math.round(maxVal - (maxVal * ratio));
          return (
            <div 
              key={`y-label-${i}`} 
              className="absolute left-0 text-[#9ca3af] text-[10px] md:text-xs text-right pr-2"
              style={{ 
                top: `${y}%`,
                width: `${padLeft}%`,
                transform: 'translateY(-50%)' 
              }}
            >
              {val}
            </div>
          );
      })}

      {/* HTML X-Axis Labels (Absolutely positioned so they don't stretch) */}
      {points.map((p, i) => (
        <div 
          key={`x-label-${i}`}
          className="absolute bottom-0 text-[#9ca3af] text-[10px] md:text-xs text-center transform -translate-x-1/2 whitespace-nowrap"
          style={{ 
            left: `${p.x}%`,
            width: '40px'
          }}
        >
          {p.label}
        </div>
      ))}

      {/* HTML Tooltip */}
      {hoverIndex !== null && (
        <div 
          className="absolute z-10 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: `${points[hoverIndex].x}%`, 
            top: `calc(${points[hoverIndex].y}% - 12px)`
          }}
        >
          <span className="font-bold block mb-1">{points[hoverIndex].label}</span>
          <span className="text-[#ffb77d]">Conversions: {points[hoverIndex].val}</span>
        </div>
      )}
    </div>
  );
}
