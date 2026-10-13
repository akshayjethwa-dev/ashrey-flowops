// src/components/oee/DowntimeParetoView.tsx

import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';
import {
  DowntimeParetoItem,
  DowntimeEventRecord,
  DowntimeReasonCode
} from '../../types/oee';

interface DowntimeParetoViewProps {
  paretoData: {
    items: DowntimeParetoItem[];
    totalMinutes: number;
    totalHours: number;
    totalOccurrences: number;
    top80PercentCutoffIndex: number;
  };
  events: DowntimeEventRecord[];
  onOpenCaptureModal?: (machineId: string) => void;
  onOpenResolveModal?: (event: DowntimeEventRecord) => void;
}

export const DowntimeParetoView: React.FC<DowntimeParetoViewProps> = ({
  paretoData,
  events,
  onOpenResolveModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pareto_chart' | 'events_log'>('pareto_chart');

  const { items, totalHours, totalOccurrences, top80PercentCutoffIndex } = paretoData;

  // Filtered Pareto items if category selected
  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(it => it.category === selectedCategory);

  // Math for Pareto Combined Bar + Cumulative Line Chart
  // Width 700, Height 260
  const chartW = 720;
  const chartH = 260;
  const padL = 50;
  const padR = 50;
  const padT = 30;
  const padB = 60;

  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const displayCount = Math.min(items.length, 8);
  const displayItems = items.slice(0, displayCount);

  const maxDuration = Math.max(1, ...displayItems.map(d => d.totalHours));
  const slotW = displayCount > 0 ? innerW / displayCount : innerW;
  const barW = Math.max(16, slotW * 0.55);

  // Line points for cumulative %
  const linePoints = displayItems.map((d, idx) => {
    const cx = padL + idx * slotW + slotW / 2;
    const cy = padT + innerH - (d.cumulativePercentage / 100) * innerH;
    return `${cx},${cy}`;
  }).join(' ');

  // 80% cutoff line Y
  const cutoff80Y = padT + innerH - 0.8 * innerH;

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl text-white">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/80">
              Six Big Losses · JIPM / TPM Standard
            </span>
            <span className="text-xs text-slate-400">
              Pareto (80/20) Principle
            </span>
          </div>
          <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
            <BarChart2 size={18} className="text-cyan-400" />
            <span>Downtime Root Cause Pareto Analysis & Events Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic categorization and duration calculation from operator prompts and PLC stops. 80% of machine downtime is driven by the vital few root causes.
          </p>
        </div>

        {/* View switcher tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('pareto_chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'pareto_chart'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pareto 80/20 Chart
          </button>
          <button
            onClick={() => setActiveTab('events_log')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'events_log'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Downtime Log ({events.length})
          </button>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 bg-slate-850 border-b border-slate-700/60 text-xs font-mono">
        <div className="p-3.5">
          <span className="text-slate-400 block text-[10px] uppercase">TOTAL DOWNTIME LOSS</span>
          <span className="text-xl font-bold text-rose-400">{totalHours} hrs</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">({paretoData.totalMinutes} min)</span>
        </div>

        <div className="p-3.5">
          <span className="text-slate-400 block text-[10px] uppercase">DOWNTIME OCCURRENCES</span>
          <span className="text-xl font-bold text-white">{totalOccurrences} events</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Across fleet</span>
        </div>

        <div className="p-3.5">
          <span className="text-slate-400 block text-[10px] uppercase">VITAL FEW ROOT CAUSES</span>
          <span className="text-xl font-bold text-amber-300">
            {top80PercentCutoffIndex + 1} of {items.length} codes
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Account for ~80% of lost time</span>
        </div>

        <div className="p-3.5">
          <span className="text-slate-400 block text-[10px] uppercase">ACTIVE OPEN STOPS</span>
          <span className="text-xl font-bold text-cyan-300">
            {events.filter(e => !e.resolved).length} machine(s)
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Pending resolution</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'pareto_chart' ? (
        <div className="p-5 space-y-6">
          {/* Dual-Axis SVG Pareto Chart */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">
                Left Axis: Lost Hours (Bars) · Right Axis: Cumulative % (Line)
              </span>
              <span className="font-mono text-amber-400 text-[11px]">
                --- 80% Vital Few Threshold Line
              </span>
            </div>

            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
              {/* Background horizontal grid lines */}
              {[0, 25, 50, 75, 100].map(pct => {
                const y = padT + innerH - (pct / 100) * innerH;
                return (
                  <g key={pct}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray={pct === 80 ? '4 3' : pct === 0 ? '0' : '2 2'}
                    />
                    {/* Left axis (Hours) */}
                    <text
                      x={padL - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {((pct / 100) * maxDuration).toFixed(1)}h
                    </text>
                    {/* Right axis (Cumulative %) */}
                    <text
                      x={chartW - padR + 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* 80% Reference Target Line */}
              <line
                x1={padL}
                y1={cutoff80Y}
                x2={chartW - padR}
                y2={cutoff80Y}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={chartW - padR - 6}
                y={cutoff80Y - 5}
                fill="#f59e0b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
                fontWeight="bold"
              >
                80% Cutoff
              </text>

              {/* Bars for individual reason codes */}
              {displayItems.map((item, idx) => {
                const cx = padL + idx * slotW + slotW / 2;
                const barH = (item.totalHours / maxDuration) * innerH;
                const barX = cx - barW / 2;
                const barY = padT + innerH - barH;

                return (
                  <g key={item.code} className="transition-all hover:opacity-80">
                    <rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={Math.max(2, barH)}
                      fill={item.color}
                      rx="4"
                      className="transition-all"
                    />

                    {/* Bar value label */}
                    <text
                      x={cx}
                      y={barY - 6}
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.totalHours}h
                    </text>

                    {/* X-axis code label */}
                    <text
                      x={cx}
                      y={chartH - padB + 14}
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.code}
                    </text>

                    {/* X-axis percentage label */}
                    <text
                      x={cx}
                      y={chartH - padB + 27}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {item.percentage}%
                    </text>
                  </g>
                );
              })}

              {/* Cumulative Percentage Polyline */}
              {displayItems.length > 1 && (
                <>
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    points={linePoints}
                  />

                  {/* Polyline data dots */}
                  {displayItems.map((item, idx) => {
                    const cx = padL + idx * slotW + slotW / 2;
                    const cy = padT + innerH - (item.cumulativePercentage / 100) * innerH;
                    return (
                      <g key={`dot-${item.code}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="4"
                          fill="#0284c7"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={cx}
                          y={cy - 7}
                          fill="#38bdf8"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {item.cumulativePercentage}%
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          {/* Pareto Breakdown Ranked Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Reason Code</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Occurrences</th>
                  <th className="py-2.5 px-3 text-right">Lost Hours</th>
                  <th className="py-2.5 px-3 text-right">% of Total</th>
                  <th className="py-2.5 px-3 text-right">Cumulative %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono">
                {filteredItems.map((item, idx) => {
                  const isVitalFew = idx <= top80PercentCutoffIndex;
                  return (
                    <tr
                      key={item.code}
                      className={`hover:bg-slate-700/30 transition ${
                        isVitalFew ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isVitalFew
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-cyan-300 font-bold">
                        {item.code}
                      </td>

                      <td className="py-2.5 px-3 font-sans text-white font-medium">
                        {item.label}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-300 font-sans">
                          {item.categoryLabel}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {item.occurrences}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-rose-300">
                        {item.totalHours} hrs
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {item.percentage}%
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                        {item.cumulativePercentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Full Events Log View with Resolution Action */
        <div className="p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-3">Machine</th>
                  <th className="py-3 px-3">Reason Code & Cause</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Work Order</th>
                  <th className="py-3 px-3">Logged By</th>
                  <th className="py-3 px-3">Start Time</th>
                  <th className="py-3 px-3 text-right">Duration</th>
                  <th className="py-3 px-3 text-right">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono">
                {events.map(evt => {
                  const isOngoing = !evt.resolved;
                  const elapsedMin = isOngoing
                    ? Math.max(1, Math.round((Date.now() - new Date(evt.startTime).getTime()) / 60000))
                    : evt.durationMinutes;

                  return (
                    <tr key={evt.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-white text-xs">{evt.machineCode}</div>
                        <div className="text-[10px] text-slate-400">{evt.machineName}</div>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        <div className="text-rose-300 font-bold font-mono text-[11px]">
                          {evt.reasonCode}
                        </div>
                        <div className="text-slate-200 text-xs">{evt.reasonLabel}</div>
                        {evt.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 font-sans">
                            "{evt.notes}"
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-300 text-xs">
                        {evt.categoryLabel}
                      </td>

                      <td className="py-3 px-3 text-cyan-300 text-xs">
                        {evt.workOrderNumber || '—'}
                      </td>

                      <td className="py-3 px-3 text-slate-300 font-sans text-xs">
                        {evt.operatorName}
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-xs">
                        <span className={isOngoing ? 'text-amber-400 animate-pulse' : 'text-slate-200'}>
                          {elapsedMin} min
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isOngoing ? (
                          <button
                            onClick={() => onOpenResolveModal?.(evt)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-sans font-bold shadow-xs transition cursor-pointer"
                          >
                            Resolve & Resume
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-[11px] flex items-center justify-end gap-1 font-sans">
                            <CheckCircle2 size={12} />
                            <span>Resolved</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
