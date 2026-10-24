// src/components/margin-analysis/MarginTrendChart.tsx

import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  BarChart3,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { PeriodPnLRecord } from '../../types/marginAnalysis';

interface MarginTrendChartProps {
  periods: PeriodPnLRecord[];
  targetMarginPct: number;
}

export const MarginTrendChart: React.FC<MarginTrendChartProps> = ({
  periods,
  targetMarginPct
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const maxRevenue = Math.max(...periods.map(p => p.revenue), 100000);
  const maxMargin = Math.max(...periods.map(p => p.grossMarginPct), targetMarginPct, 35);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Gross Margin Trajectory & Revenue Trend Over Time
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Historical monthly trajectory of Commercial Revenue, Cost of Goods Sold (COGS), and Gross Margin % against the {targetMarginPct}% Target Benchmark.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-300">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/80" />
            <span className="text-slate-300">COGS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-teal-400 rounded-full" />
            <span className="text-slate-300">Gross Margin %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 border-b border-amber-400 border-dashed" />
            <span className="text-amber-400 font-medium">Target ({targetMarginPct}%)</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual SVG Chart */}
      <div className="w-full bg-slate-950 p-5 rounded-xl border border-slate-800/80">
        <div className="relative h-64 w-full">
          {/* Target Benchmark Line */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-amber-500/60 z-10 flex items-center justify-end pr-2"
            style={{
              bottom: `${(targetMarginPct / maxMargin) * 100}%`
            }}
          >
            <span className="text-[10px] font-mono text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/40">
              Benchmark: {targetMarginPct}%
            </span>
          </div>

          {/* SVG Trend Line for Gross Margin % */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {periods.length > 1 && (
              <>
                <polyline
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={periods
                    .map((p, idx) => {
                      const xPct = ((idx + 0.5) / periods.length) * 100;
                      const yPct = 100 - (p.grossMarginPct / maxMargin) * 100;
                      return `${xPct}%,${yPct}%`;
                    })
                    .join(' ')}
                />
                {periods.map((p, idx) => {
                  const xPct = ((idx + 0.5) / periods.length) * 100;
                  const yPct = 100 - (p.grossMarginPct / maxMargin) * 100;
                  return (
                    <circle
                      key={idx}
                      cx={`${xPct}%`}
                      cy={`${yPct}%`}
                      r={hoveredIdx === idx ? 6 : 4}
                      fill="#042f2e"
                      stroke="#2dd4bf"
                      strokeWidth="2.5"
                    />
                  );
                })}
              </>
            )}
          </svg>

          {/* Dual Bar Columns (Revenue vs COGS) */}
          <div className="h-full flex items-end justify-between gap-3 pt-6 pb-2">
            {periods.map((p, idx) => {
              const revHeight = (p.revenue / maxRevenue) * 85;
              const cogsHeight = (p.totalCogs / maxRevenue) * 85;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={p.periodId}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip Overlay */}
                  {isHovered && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white p-3 rounded-lg border border-slate-700 shadow-2xl z-30 text-xs w-64 pointer-events-none">
                      <div className="font-bold text-teal-300 mb-1 border-b border-slate-700 pb-1 flex justify-between">
                        <span>{p.periodLabel}</span>
                        <span>{p.orderCount} Jobs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                        <span className="text-slate-400">Revenue:</span>
                        <span className="text-emerald-400 text-right">{formatInr(p.revenue)}</span>
                        <span className="text-slate-400">COGS:</span>
                        <span className="text-rose-400 text-right">{formatInr(p.totalCogs)}</span>
                        <span className="text-slate-400">Gross Profit:</span>
                        <span className="text-teal-400 font-bold text-right">{formatInr(p.grossProfit)}</span>
                        <span className="text-slate-400">Gross Margin:</span>
                        <span className={`font-bold text-right ${p.grossMarginPct >= targetMarginPct ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {p.grossMarginPct}%
                        </span>
                        <span className="text-slate-400">COPQ Scrap/Rwk:</span>
                        <span className="text-red-400 text-right">{formatInr(p.copqLosses)}</span>
                      </div>
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full max-w-[64px] flex items-end justify-center gap-1 h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}%` }}
                      className={`w-1/2 rounded-t transition-all ${
                        isHovered ? 'bg-emerald-400' : 'bg-emerald-600/80 hover:bg-emerald-500'
                      }`}
                    />
                    {/* COGS Bar */}
                    <div
                      style={{ height: `${cogsHeight}%` }}
                      className={`w-1/2 rounded-t transition-all ${
                        isHovered ? 'bg-rose-400' : 'bg-rose-600/80 hover:bg-rose-500'
                      }`}
                    />
                  </div>

                  {/* Period Label */}
                  <div className="mt-2 text-[11px] font-medium text-slate-400 text-center truncate w-full">
                    {p.periodLabel.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-teal-400">
                    {p.grossMarginPct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Periodic P&L Performance Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-3 text-right">Orders</th>
              <th className="py-3 px-3 text-right">Units</th>
              <th className="py-3 px-4 text-right">Revenue (₹)</th>
              <th className="py-3 px-4 text-right">Materials (₹)</th>
              <th className="py-3 px-4 text-right">Labor (₹)</th>
              <th className="py-3 px-4 text-right">Machine/Ovh (₹)</th>
              <th className="py-3 px-4 text-right">COPQ Loss (₹)</th>
              <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
              <th className="py-3 px-4 text-right">Gross Margin %</th>
              <th className="py-3 px-4 text-center">Benchmark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {periods.map(p => {
              const isTargetMet = p.grossMarginPct >= targetMarginPct;
              return (
                <tr key={p.periodId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{p.periodLabel}</span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">{p.orderCount}</td>
                  <td className="py-3 px-3 text-right text-slate-400">{p.unitsCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatInr(p.revenue)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatInr(p.materialCost)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatInr(p.laborCost)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatInr(p.machineCost + p.overheadCost)}</td>
                  <td className="py-3 px-4 text-right text-rose-400">{formatInr(p.copqLosses)}</td>
                  <td className="py-3 px-4 text-right text-teal-400 font-bold">{formatInr(p.grossProfit)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${isTargetMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {p.grossMarginPct}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        isTargetMet
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {isTargetMet ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Met (+{(p.grossMarginPct - targetMarginPct).toFixed(1)}%)
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" /> Gap ({(p.grossMarginPct - targetMarginPct).toFixed(1)}%)
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
