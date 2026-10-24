// src/components/defect-pareto/DefectParetoChart.tsx

import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ParetoAnalysisResult, ParetoItem, ParetoMetricType, DefectClassification } from '../../types/defectPareto';

interface DefectParetoChartProps {
  paretoResult: ParetoAnalysisResult;
  metricType: ParetoMetricType;
  onChangeMetric: (metric: ParetoMetricType) => void;
  selectedClassification: string | null;
  onSelectClassification: (key: string | null) => void;
}

export const DefectParetoChart: React.FC<DefectParetoChartProps> = ({
  paretoResult,
  metricType,
  onChangeMetric,
  selectedClassification,
  onSelectClassification
}) => {
  const [hoveredItem, setHoveredItem] = useState<ParetoItem | null>(null);

  const { items, totalDefectCount, totalCostCopq, totalDefectiveUnits, cutoffIndex, vitalFewCount } = paretoResult;

  // Chart dimensions
  const chartW = 760;
  const chartH = 300;
  const padL = 55;
  const padR = 55;
  const padT = 35;
  const padB = 75;

  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const displayCount = Math.min(items.length, 10);
  const displayItems = items.slice(0, displayCount);

  // Maximum value for bars
  const maxBarVal = Math.max(
    1,
    ...displayItems.map(d => 
      metricType === 'frequency' 
        ? d.frequencyCount 
        : metricType === 'cost_copq' 
        ? d.totalCostCopq 
        : d.defectiveUnits
    )
  );

  const slotW = displayCount > 0 ? innerW / displayCount : innerW;
  const barW = Math.max(18, slotW * 0.58);

  // 80% cutoff line coordinate
  const cutoff80Y = padT + innerH - (0.8 * innerH);

  // Build cumulative line points
  const linePoints = displayItems.map((d, idx) => {
    const cx = padL + idx * slotW + slotW / 2;
    const cy = padT + innerH - (d.cumulativePercentage / 100) * innerH;
    return `${cx},${cy}`;
  }).join(' ');

  const getMetricVal = (item: ParetoItem) => {
    if (metricType === 'frequency') return `${item.frequencyCount} defects`;
    if (metricType === 'cost_copq') return `$${item.totalCostCopq.toLocaleString()}`;
    return `${item.defectiveUnits} units`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Metric Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <TrendingUp size={12} className="text-rose-400" />
              Pareto 80/20 Quality Principle
            </span>
            <span className="text-xs text-slate-400">
              ISO 9001:2015 §8.7 & Six Sigma DMAIC
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
            <BarChart2 size={20} className="text-rose-400" />
            <span>Defect Pareto Frequency & Cumulative Impact Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify the <strong className="text-rose-300">Vital Few</strong> defect classifications driving 80% of scrap and rework losses vs the Trivial Many.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-center">
          <button
            onClick={() => onChangeMetric('frequency')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              metricType === 'frequency'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 size={13} />
            <span>Frequency Count</span>
          </button>
          <button
            onClick={() => onChangeMetric('cost_copq')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              metricType === 'cost_copq'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={13} />
            <span>Cost of Poor Quality ($)</span>
          </button>
          <button
            onClick={() => onChangeMetric('defective_units')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              metricType === 'defective_units'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Defective Units</span>
          </button>
        </div>
      </div>

      {/* Vital Few Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Vital Few Defect Types</div>
            <div className="text-base font-bold text-white flex items-center gap-1.5">
              <span>{vitalFewCount} of {items.length} categories</span>
              <span className="text-xs font-normal text-rose-400">
                ({Math.round((vitalFewCount / Math.max(1, items.length)) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Total COPQ Scrap/Rework</div>
            <div className="text-base font-bold text-amber-300">
              ${totalCostCopq.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Total Defective Units</div>
            <div className="text-base font-bold text-cyan-300">
              {totalDefectiveUnits.toLocaleString()} units
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Filter Status</div>
            <div className="text-xs font-medium text-slate-300">
              {selectedClassification ? (
                <button 
                  onClick={() => onSelectClassification(null)}
                  className="text-rose-400 hover:underline flex items-center gap-1"
                >
                  Filtered: {items.find(i => i.categoryKey === selectedClassification)?.categoryName.slice(0, 14)}... ✕
                </button>
              ) : (
                'Showing All Categories'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Pareto Chart */}
      <div className="relative w-full overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
            {/* Background Grid & 80% Reference Band */}
            <defs>
              <linearGradient id="barVitalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="barTrivialGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="barSelectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const y = padT + innerH - frac * innerH;
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={padL + innerW}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray={frac === 0 ? '0' : '4,4'}
                    strokeWidth="1"
                  />
                  {/* Left Y-Axis Values (Value) */}
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {metricType === 'cost_copq'
                      ? `$${Math.round((frac * maxBarVal) / 100) * 100}`
                      : Math.round(frac * maxBarVal)}
                  </text>
                  {/* Right Y-Axis Values (Cumulative %) */}
                  <text
                    x={padL + innerW + 10}
                    y={y + 4}
                    textAnchor="start"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {Math.round(frac * 100)}%
                  </text>
                </g>
              );
            })}

            {/* 80% Vital Few Horizontal Reference Line */}
            <line
              x1={padL}
              y1={cutoff80Y}
              x2={padL + innerW}
              y2={cutoff80Y}
              stroke="#fb7185"
              strokeDasharray="6,4"
              strokeWidth="2"
              opacity="0.9"
            />
            <rect
              x={padL + innerW - 130}
              y={cutoff80Y - 18}
              width="125"
              height="16"
              fill="#881337"
              rx="4"
              opacity="0.9"
            />
            <text
              x={padL + innerW - 68}
              y={cutoff80Y - 6}
              textAnchor="middle"
              fill="#ffe4e6"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              80% VITAL FEW CUTOFF
            </text>

            {/* Bars */}
            {displayItems.map((item, idx) => {
              const itemVal = 
                metricType === 'frequency' 
                  ? item.frequencyCount 
                  : metricType === 'cost_copq' 
                  ? item.totalCostCopq 
                  : item.defectiveUnits;

              const barH = (itemVal / maxBarVal) * innerH;
              const barX = padL + idx * slotW + (slotW - barW) / 2;
              const barY = padT + innerH - barH;

              const isSelected = selectedClassification === item.categoryKey;
              const isVital = item.isVitalFew;

              return (
                <g 
                  key={item.id} 
                  className="cursor-pointer group"
                  onClick={() => onSelectClassification(isSelected ? null : item.categoryKey)}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Bar rectangle */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={Math.max(2, barH)}
                    fill={isSelected ? 'url(#barSelectedGradient)' : isVital ? 'url(#barVitalGradient)' : 'url(#barTrivialGradient)'}
                    rx="4"
                    stroke={isSelected ? '#38bdf8' : isVital ? '#f43f5e' : '#475569'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-200 group-hover:brightness-125"
                  />

                  {/* Value on top of bar */}
                  <text
                    x={barX + barW / 2}
                    y={barY - 6}
                    textAnchor="middle"
                    fill={isSelected ? '#38bdf8' : isVital ? '#fca5a5' : '#94a3b8'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {metricType === 'cost_copq' ? `$${item.totalCostCopq}` : itemVal}
                  </text>

                  {/* X-Axis Category Label */}
                  <g transform={`translate(${barX + barW / 2}, ${padT + innerH + 16})`}>
                    <text
                      transform="rotate(35)"
                      textAnchor="start"
                      fill={isSelected ? '#38bdf8' : isVital ? '#f1f5f9' : '#94a3b8'}
                      fontSize="9.5"
                      fontWeight={isVital ? '600' : '400'}
                    >
                      {item.categoryName.length > 18 ? item.categoryName.slice(0, 16) + '…' : item.categoryName}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Cumulative % Line */}
            {displayItems.length > 1 && (
              <>
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots along cumulative line */}
                {displayItems.map((item, idx) => {
                  const cx = padL + idx * slotW + slotW / 2;
                  const cy = padT + innerH - (item.cumulativePercentage / 100) * innerH;
                  return (
                    <g key={`dot-${idx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="4.5"
                        fill="#0284c7"
                        stroke="#e0f2fe"
                        strokeWidth="2"
                      />
                      <text
                        x={cx}
                        y={cy - 9}
                        textAnchor="middle"
                        fill="#7dd3fc"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {item.cumulativePercentage}%
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* Left Axis Label */}
            <text
              x={15}
              y={padT + innerH / 2}
              transform={`rotate(-90, 15, ${padT + innerH / 2})`}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="1"
            >
              {metricType === 'frequency' ? 'DEFECT FREQUENCY' : metricType === 'cost_copq' ? 'COPQ LOSS ($)' : 'DEFECTIVE UNITS'}
            </text>

            {/* Right Axis Label */}
            <text
              x={chartW - 12}
              y={padT + innerH / 2}
              transform={`rotate(90, ${chartW - 12}, ${padT + innerH / 2})`}
              textAnchor="middle"
              fill="#0284c7"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="1"
            >
              CUMULATIVE PERCENTAGE (%)
            </text>
          </svg>
        </div>
      </div>

      {/* Legend & Tooltip detail card */}
      <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400 inline-block" />
            <span className="text-slate-300 font-medium">Vital Few (80% impact)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-600 border border-slate-500 inline-block" />
            <span className="text-slate-400 font-medium">Trivial Many</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-sky-400 inline-block" />
            <span className="text-sky-300 font-medium">Cumulative Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 border-b border-dashed border-rose-400 inline-block" />
            <span className="text-rose-300 font-medium">80% Threshold</span>
          </div>
        </div>

        {/* Hovered bar info */}
        {hoveredItem ? (
          <div className="bg-slate-950 border border-rose-800/80 rounded-xl px-3 py-1.5 flex items-center gap-3 animate-fade-in">
            <span className="font-semibold text-rose-300">{hoveredItem.categoryName}:</span>
            <span className="text-slate-300">{getMetricVal(hoveredItem)}</span>
            <span className="text-sky-400 font-mono">({hoveredItem.percentage}% total · {hoveredItem.cumulativePercentage}% cum)</span>
            <span className="text-slate-400">Machines: {hoveredItem.topMachines.join(', ')}</span>
          </div>
        ) : (
          <div className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Info size={13} className="text-slate-500" />
            <span>Click any bar to filter the 2D/3D part heatmap and drill-downs below.</span>
          </div>
        )}
      </div>
    </div>
  );
};
