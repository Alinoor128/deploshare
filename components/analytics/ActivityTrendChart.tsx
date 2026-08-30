'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, Activity } from 'lucide-react';

interface ActivityTrendChartProps {
  title?: string;
  data?: { day: string; uploads: number; downloads: number; views: number }[];
  totalViews?: number;
  totalDownloads?: number;
}

export function ActivityTrendChart({
  title = 'Platform Traffic & Activity Trends',
  data,
  totalViews = 142,
  totalDownloads = 89,
}: ActivityTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<'downloads' | 'views' | 'uploads'>('downloads');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Default 7-day mock trend if none passed
  const chartData = data || [
    { day: 'Mon', uploads: 4, downloads: 12, views: 24 },
    { day: 'Tue', uploads: 7, downloads: 18, views: 35 },
    { day: 'Wed', uploads: 5, downloads: 15, views: 28 },
    { day: 'Thu', uploads: 11, downloads: 26, views: 48 },
    { day: 'Fri', uploads: 9, downloads: 22, views: 42 },
    { day: 'Sat', uploads: 14, downloads: 34, views: 65 },
    { day: 'Sun', uploads: 12, downloads: 29, views: 54 },
  ];

  const values = chartData.map((d) => d[activeMetric]);
  const maxValue = Math.max(...values, 10);
  const chartHeight = 160;
  const chartWidth = 500;
  const stepX = chartWidth / (chartData.length - 1);

  // Generate SVG path points
  const points = values.map((val, idx) => {
    const x = idx * stepX;
    const y = chartHeight - (val / maxValue) * (chartHeight - 30) - 15;
    return { x, y, val, day: chartData[idx].day };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Live 7-Day Performance & Bandwidth Curve</p>
          </div>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          {(
            [
              { id: 'downloads', label: 'Downloads' },
              { id: 'views', label: 'Views' },
              { id: 'uploads', label: 'Uploads' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeMetric === m.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Spline Graph */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="130" x2={chartWidth} y2="130" stroke="#f1f5f9" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Spline Stroke Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                className="fill-white stroke-blue-600 stroke-[3] transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {hoveredIndex === i && (
                <g>
                  <rect
                    x={p.x - 30}
                    y={p.y - 35}
                    width="60"
                    height="24"
                    rx="6"
                    className="fill-slate-900 shadow-md"
                  />
                  <text
                    x={p.x}
                    y={p.y - 19}
                    textAnchor="middle"
                    className="fill-white font-mono text-[10px] font-bold"
                  >
                    {p.val} {activeMetric}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
          {chartData.map((d, i) => (
            <span key={i} className="text-center font-medium">
              {d.day}
            </span>
          ))}
        </div>
      </div>

      {/* Summary Metrics Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block">Weekly Spike</span>
          <span className="text-sm font-black text-slate-900 flex items-center gap-1 mt-0.5">
            +38.4%
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Views</span>
          <span className="text-sm font-black text-blue-600 mt-0.5 block">{totalViews}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Completed Downloads</span>
          <span className="text-sm font-black text-emerald-600 mt-0.5 block">{totalDownloads}</span>
        </div>
      </div>
    </Card>
  );
}
