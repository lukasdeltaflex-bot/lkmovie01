"use client";

import React, { useMemo } from "react";

interface DataPoint {
  day: string;
  value: number;
}

interface ProductionChartProps {
  data?: DataPoint[];
  color?: string;
  title?: string;
}

export function ProductionChart({ 
  data = [],
  color = "#3b82f6",
  title = "Produção de Vídeos"
}: ProductionChartProps) {
  
  const maxValue = Math.max(...data.map(d => d.value), 10);
  const height = 200;
  const width = 600;
  const padding = 40;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((d.value / maxValue) * (height - padding * 2) + padding);
      return { x, y, value: d.value, day: d.day };
    });
  }, [data, maxValue]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + 
      points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    return `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  }, [linePath, points]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-4xl border border-gray-100 dark:border-gray-800 p-8 shadow-2xl space-y-6 overflow-hidden group">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time Data</span>
        </div>
      </div>

      <div className="relative h-[220px] w-full">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line 
              key={i}
              x1={padding} 
              y1={padding + p * (height - padding * 2)} 
              x2={width - padding} 
              y2={padding + p * (height - padding * 2)} 
              stroke="currentColor" 
              className="text-gray-100 dark:text-gray-800" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
          ))}

          {/* Area under the line */}
          <path 
            d={areaPath} 
            fill="url(#chartGradient)" 
            className="animate-in fade-in duration-1000"
          />

          {/* Main Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={color} 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-in slide-in-from-left duration-1000"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i} className="group/point">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="6" 
                fill="white" 
                stroke={color} 
                strokeWidth="3" 
                className="transition-all hover:r-8 cursor-pointer shadow-xl duration-300"
              />
              {/* Tooltip on hover (Simulated with text) */}
              <text 
                x={p.x} 
                y={p.y - 15} 
                textAnchor="middle" 
                className="text-[10px] font-black fill-gray-900 dark:fill-white opacity-0 group-hover/point:opacity-100 transition-opacity duration-300"
              >
                {p.value}
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, i) => (
            <text 
              key={i} 
              x={p.x} 
              y={height - 5} 
              textAnchor="middle" 
              className="text-[10px] font-bold fill-gray-400 uppercase tracking-tighter"
            >
              {p.day}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-800">
         <div className="flex gap-6">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-gray-400 uppercase">Média Diária</p>
               <p className="text-xl font-black text-gray-900 dark:text-white italic">{data.length > 0 ? (data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(1) : "0"}</p>
            </div>
         </div>
      </div>
    </div>
  );
}
