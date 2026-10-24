// src/components/scrap-rework/CopqParetoChart.tsx

import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  Factory,
  Clock,
  User,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ParetoDimension,
  ParetoAnalysisResult,
  ParetoBarItem
} from '../../types/scrapRework';

interface CopqParetoChartProps {
  analysis: ParetoAnalysisResult;
  selectedDimension: ParetoDimension;
  onDimensionChange: (dim: ParetoDimension) => void;
  onSelectItem?: (item: ParetoBarItem) => void;
}

export const CopqParetoChart: React.FC<CopqParetoChartProps> = ({
  analysis,
  selectedDimension,
  onDimensionChange,
  onSelectItem
}) => {
  const [hoveredItem, setHoveredItem] = useState<ParetoBarItem | null>(null);

  const { items, totalCopq, vitalFewCount, vitalFewPercentage } = analysis;

  const maxCost = Math.max(...items.map(i => i.totalCost), 1);
  const chartHeight = 240; // px for SVG coordinate system

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
      {/* Top Header & Dimension Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Cost of Poor Quality (COPQ) — Pareto Analysis
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-medium">
                  80 / 20 Rule
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dual-axis distribution: Direct Scrap & Rework Cost ($) vs Cumulative Contribution (%)
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => onDimensionChange('machine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDimension === 'machine'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>By Machine</span>
          </button>
          <button
            onClick={() => onDimensionChange('shift')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDimension === 'shift'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>By Shift</span>
          </button>
          <button
            onClick={() => onDimensionChange('operator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDimension === 'operator'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>By Operator</span>
          </button>
          <button
            onClick={() => onDimensionChange('reason')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedDimension === 'reason'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>By Reason Code</span>
          </button>
        </div>
      </div>

      {/* Vital Few Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Evaluated COPQ</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">${totalCopq.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <Flame className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Vital Few Offenders</div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
              {vitalFewCount} <span className="text-xs text-slate-400 font-normal">of {items.length} ({vitalFewPercentage}% COPQ)</span>
            </div>
          </div>
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-slate-950/60 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pareto Rule Recommendation</div>
            <div className="text-xs text-indigo-300 mt-0.5 font-medium line-clamp-2">
              Focus root-cause containment on top {vitalFewCount} items to eliminate {vitalFewPercentage}% of losses.
            </div>
          </div>
          <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Legend & Threshold Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mb-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-slate-300">Net Scrap Cost ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-slate-300">Rework Cost ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-cyan-400 rounded-full" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 -ml-2" />
            <span className="text-slate-300">Cumulative %</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <span className="inline-block w-3 border-t-2 border-dashed border-amber-400" />
          <span>80% Vital Few Cutoff</span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto bg-slate-950/90 rounded-xl p-3 border border-slate-800/80">
        <div className="min-w-[650px]">
          {/* Chart Title / Axis Header */}
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1 px-8">
            <span>Cost Scale ($0 — ${Math.ceil(maxCost).toLocaleString()})</span>
            <span>Cumulative Impact (0% — 100%)</span>
          </div>

          <svg viewBox={`0 0 700 ${chartHeight + 60}`} className="w-full h-64 overflow-visible">
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map(pct => {
              const y = chartHeight - (pct / 100) * chartHeight + 10;
              return (
                <g key={pct}>
                  <line
                    x1="45"
                    y1={y}
                    x2="655"
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray={pct === 80 ? "4 4" : "2 2"}
                    strokeWidth={pct === 80 ? "1.5" : "1"}
                  />
                  {/* Left Cost Label */}
                  <text
                    x="40"
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ${Math.round((pct / 100) * maxCost)}
                  </text>
                  {/* Right % Label */}
                  <text
                    x="660"
                    y={y + 3}
                    textAnchor="start"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* 80% Threshold Line */}
            {(() => {
              const y80 = chartHeight - (80 / 100) * chartHeight + 10;
              return (
                <g>
                  <line
                    x1="45"
                    y1={y80}
                    x2="655"
                    y2={y80}
                    stroke="#f59e0b"
                    strokeDasharray="6 3"
                    strokeWidth="1.5"
                  />
                  <text
                    x="650"
                    y={y80 - 4}
                    textAnchor="end"
                    fill="#f59e0b"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    80% Vital Threshold
                  </text>
                </g>
              );
            })()}

            {/* Bars and Cumulative Points */}
            {items.map((item, idx) => {
              const barWidth = Math.min(48, Math.max(22, 580 / (items.length * 1.5)));
              const step = (655 - 60) / Math.max(items.length, 1);
              const xCenter = 60 + idx * step + step / 2;
              const xLeft = xCenter - barWidth / 2;

              // Bar Heights
              const totalHeight = (item.totalCost / maxCost) * chartHeight;
              const scrapHeight = (item.scrapCost / maxCost) * chartHeight;
              const reworkHeight = (item.reworkCost / maxCost) * chartHeight;

              const yBase = chartHeight + 10;
              const yScrapTop = yBase - scrapHeight;
              const yReworkTop = yScrapTop - reworkHeight;

              // Cumulative line coordinate
              const cy = chartHeight - (item.cumulativePercentage / 100) * chartHeight + 10;

              return (
                <g
                  key={item.id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => onSelectItem && onSelectItem(item)}
                >
                  {/* Scrap portion of stacked bar */}
                  <rect
                    x={xLeft}
                    y={yScrapTop}
                    width={barWidth}
                    height={Math.max(1, scrapHeight)}
                    fill={item.isVitalFew ? "#f43f5e" : "#fb7185"}
                    rx={reworkHeight > 0 ? 0 : 3}
                    className="transition-all duration-200 group-hover:opacity-90"
                  />

                  {/* Rework portion of stacked bar */}
                  {reworkHeight > 0 && (
                    <rect
                      x={xLeft}
                      y={yReworkTop}
                      width={barWidth}
                      height={Math.max(1, reworkHeight)}
                      fill={item.isVitalFew ? "#f59e0b" : "#fbbf24"}
                      rx={3}
                      className="transition-all duration-200 group-hover:opacity-90"
                    />
                  )}

                  {/* Value on Top of Bar */}
                  <text
                    x={xCenter}
                    y={yReworkTop - 4}
                    textAnchor="middle"
                    fill={item.isVitalFew ? "#fbbf24" : "#cbd5e1"}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ${Math.round(item.totalCost)}
                  </text>

                  {/* X Axis Label */}
                  <text
                    x={xCenter}
                    y={chartHeight + 24}
                    textAnchor="middle"
                    fill={item.isVitalFew ? "#f8fafc" : "#94a3b8"}
                    fontSize="10"
                    fontWeight={item.isVitalFew ? "bold" : "normal"}
                    className="truncate"
                  >
                    {item.label.length > 12 ? item.label.slice(0, 11) + '…' : item.label}
                  </text>

                  {/* Sub-label (Units / Vital Tag) */}
                  <text
                    x={xCenter}
                    y={chartHeight + 36}
                    textAnchor="middle"
                    fill={item.isVitalFew ? "#f43f5e" : "#64748b"}
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {item.isVitalFew ? '● VITAL' : `${item.totalEvents} evts`}
                  </text>
                </g>
              );
            })}

            {/* Cumulative Line Path */}
            {items.length > 0 && (() => {
              const step = (655 - 60) / Math.max(items.length, 1);
              const points = items.map((item, idx) => {
                const xCenter = 60 + idx * step + step / 2;
                const cy = chartHeight - (item.cumulativePercentage / 100) * chartHeight + 10;
                return `${xCenter},${cy}`;
              });

              return (
                <g>
                  {/* Connecting Line */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.join(' ')}
                  />

                  {/* Data Dots */}
                  {items.map((item, idx) => {
                    const xCenter = 60 + idx * step + step / 2;
                    const cy = chartHeight - (item.cumulativePercentage / 100) * chartHeight + 10;
                    return (
                      <g key={`pt-${item.id}`}>
                        <circle
                          cx={xCenter}
                          cy={cy}
                          r="4"
                          fill="#083344"
                          stroke="#22d3ee"
                          strokeWidth="2"
                        />
                        <text
                          x={xCenter}
                          y={cy - 6}
                          textAnchor="middle"
                          fill="#22d3ee"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {item.cumulativePercentage}%
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Hover Tooltip Card */}
      {hoveredItem && (
        <div className="mt-3 p-3 bg-slate-800/90 border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              hoveredItem.isVitalFew ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-700 text-slate-300'
            }`}>
              {hoveredItem.isVitalFew ? 'Vital Few (Top 80%)' : 'Useful Many'}
            </span>
            <div className="font-bold text-white text-sm">{hoveredItem.label}</div>
            {hoveredItem.subLabel && (
              <span className="text-slate-400 font-mono">({hoveredItem.subLabel})</span>
            )}
          </div>

          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="text-slate-400 mr-1">Scrap:</span>
              <span className="text-rose-400 font-semibold">${hoveredItem.scrapCost.toFixed(2)}</span>
              <span className="text-slate-500 text-[10px] ml-1">({hoveredItem.scrapUnits} pcs)</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Rework:</span>
              <span className="text-amber-400 font-semibold">${hoveredItem.reworkCost.toFixed(2)}</span>
              <span className="text-slate-500 text-[10px] ml-1">({hoveredItem.reworkUnits} pcs)</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Total COPQ:</span>
              <span className="text-white font-bold">${hoveredItem.totalCost.toFixed(2)}</span>
              <span className="text-cyan-400 text-[10px] ml-1 font-bold">({hoveredItem.percentage}%)</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Cumul:</span>
              <span className="text-cyan-300 font-bold">{hoveredItem.cumulativePercentage}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
