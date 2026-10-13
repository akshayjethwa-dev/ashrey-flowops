// src/components/oee/HistoricalOeeTrendChart.tsx

import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Award,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { HistoricalOeePoint, DowntimeLossCategory } from '../../types/oee';

interface HistoricalOeeTrendChartProps {
  onFetchTrends: (timeframe: 'today' | 'last_7_days' | 'last_30_days') => HistoricalOeePoint[];
  downtimeLosses: DowntimeLossCategory[];
}

export const HistoricalOeeTrendChart: React.FC<HistoricalOeeTrendChartProps> = ({
  onFetchTrends,
  downtimeLosses
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'last_7_days' | 'last_30_days'>('last_7_days');
  const [activeMetricTab, setActiveMetricTab] = useState<'oee' | 'components' | 'downtime'>('oee');

  const trends = onFetchTrends(timeframe);

  // Math for SVG Chart:
  // Width 600, Height 220, padding left 45, bottom 30, right 20, top 20
  const chartW = 580;
  const chartH = 200;
  const padL = 40;
  const padR = 20;
  const padT = 25;
  const padB = 30;

  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const pointsCount = trends.length;
  const stepX = pointsCount > 1 ? innerW / (pointsCount - 1) : innerW;

  // Coordinate mapper for percentage (0 to 100%) -> Y coordinate
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padT + innerH - (clamped / 100) * innerH;
  };

  const getX = (idx: number) => padL + idx * stepX;

  // Build SVG polyline points string
  const oeeLinePoints = trends.map((pt, idx) => `${getX(idx)},${getY(pt.oee)}`).join(' ');
  const availLinePoints = trends.map((pt, idx) => `${getX(idx)},${getY(pt.availability)}`).join(' ');
  const perfLinePoints = trends.map((pt, idx) => `${getX(idx)},${getY(pt.performance)}`).join(' ');
  const qualLinePoints = trends.map((pt, idx) => `${getX(idx)},${getY(pt.quality)}`).join(' ');

  // 85% Benchmark Line Y
  const benchmarkY = getY(85);

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 size={18} className="text-cyan-400" />
            <span>Historical OEE Trends & Loss Pareto</span>
          </h2>
          <p className="text-xs text-slate-400">
            Temporal performance analytics benchmarked against World-Class 85% OEE
          </p>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveMetricTab('oee')}
              className={`px-3 py-1 rounded-md transition ${
                activeMetricTab === 'oee'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              OEE Trend
            </button>
            <button
              onClick={() => setActiveMetricTab('components')}
              className={`px-3 py-1 rounded-md transition ${
                activeMetricTab === 'components'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A / P / Q Stack
            </button>
            <button
              onClick={() => setActiveMetricTab('downtime')}
              className={`px-3 py-1 rounded-md transition ${
                activeMetricTab === 'downtime'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Downtime Pareto
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-xs font-mono">
            {(['today', 'last_7_days', 'last_30_days'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeframe === tf
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'today' ? 'Today' : tf === 'last_7_days' ? '7D' : '30D'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Body */}
      {activeMetricTab !== 'downtime' ? (
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-56 select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid Lines */}
            {[100, 85, 70, 50].map(val => (
              <g key={val}>
                <line
                  x1={padL}
                  y1={getY(val)}
                  x2={chartW - padR}
                  y2={getY(val)}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray={val === 85 ? '3 3' : 'none'}
                />
                <text
                  x={padL - 6}
                  y={getY(val) + 3}
                  fill={val === 85 ? '#fbbf24' : '#64748b'}
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                  fontWeight={val === 85 ? 'bold' : 'normal'}
                >
                  {val}%
                </text>
              </g>
            ))}

            {/* Benchmark 85% Label */}
            <text
              x={chartW - padR}
              y={benchmarkY - 4}
              fill="#fbbf24"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
              fontWeight="bold"
            >
              85% World-Class Benchmark
            </text>

            {/* Area Fill for OEE */}
            {activeMetricTab === 'oee' && (
              <polygon
                points={`${getX(0)},${getY(0)} ${oeeLinePoints} ${getX(trends.length - 1)},${getY(0)}`}
                fill="url(#oeeGradient)"
                opacity="0.3"
              />
            )}

            <defs>
              <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Trendlines */}
            {activeMetricTab === 'oee' && (
              <polyline
                points={oeeLinePoints}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {activeMetricTab === 'components' && (
              <>
                {/* Availability Line (Cyan) */}
                <polyline
                  points={availLinePoints}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Performance Line (Emerald) */}
                <polyline
                  points={perfLinePoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Quality Line (Purple) */}
                <polyline
                  points={qualLinePoints}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Points & Labels */}
            {trends.map((pt, idx) => {
              const cx = getX(idx);
              const cy = getY(pt.oee);
              return (
                <g key={idx}>
                  {activeMetricTab === 'oee' && (
                    <>
                      <circle cx={cx} cy={cy} r="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
                      <text
                        x={cx}
                        y={cy - 8}
                        fill="#f8fafc"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {pt.oee.toFixed(1)}%
                      </text>
                    </>
                  )}

                  {/* X-axis label */}
                  <text
                    x={cx}
                    y={chartH - 10}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-300 pt-2 border-t border-slate-700/60">
            {activeMetricTab === 'oee' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span>Real-Time OEE Trendline</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-amber-300">
                  <span className="w-3 h-0.5 bg-amber-400 border-dashed" />
                  <span>85% Benchmark Target</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400" />
                  <span>Availability (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span>Performance (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-400" />
                  <span>Quality (%)</span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Downtime Six Big Losses Pareto View */
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Six Big Losses — Downtime Root Cause Pareto Analysis</span>
            <span className="text-[11px] font-mono text-slate-400">Total: 12.5 hrs lost</span>
          </div>

          <div className="space-y-2.5">
            {downtimeLosses.map(loss => (
              <div key={loss.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: loss.color }} />
                    <span className="text-slate-200 font-medium">{loss.category}</span>
                  </div>
                  <div className="font-mono text-slate-300">
                    <strong>{loss.hours} hrs</strong> ({loss.percentage}% · {loss.occurrences} events)
                  </div>
                </div>

                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${loss.percentage}%`,
                      backgroundColor: loss.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
