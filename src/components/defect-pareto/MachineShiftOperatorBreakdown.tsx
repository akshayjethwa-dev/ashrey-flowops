// src/components/defect-pareto/MachineShiftOperatorBreakdown.tsx

import React, { useState } from 'react';
import {
  Factory,
  Clock,
  User,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  ChevronRight,
  Sparkles,
  Cpu,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  MachineBreakdownItem,
  ShiftBreakdownItem,
  OperatorBreakdownItem,
  ShiftType
} from '../../types/defectPareto';

interface MachineShiftOperatorBreakdownProps {
  machines: MachineBreakdownItem[];
  shifts: ShiftBreakdownItem[];
  operators: OperatorBreakdownItem[];
  activeMachineId?: string;
  activeShift?: string;
  activeOperatorId?: string;
  onFilterMachine: (machineId: string | undefined) => void;
  onFilterShift: (shift: ShiftType | 'all') => void;
  onFilterOperator: (operatorId: string | undefined) => void;
}

export const MachineShiftOperatorBreakdown: React.FC<MachineShiftOperatorBreakdownProps> = ({
  machines,
  shifts,
  operators,
  activeMachineId,
  activeShift,
  activeOperatorId,
  onFilterMachine,
  onFilterShift,
  onFilterOperator
}) => {
  const [activeTab, setActiveTab] = useState<'machine' | 'shift' | 'operator' | 'matrix'>('machine');

  const totalDefects = machines.reduce((acc, m) => acc + m.defectCount, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Top Header & Drill-down Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Cpu size={12} className="text-indigo-400" />
              Root-Cause Attribution Matrix
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Machine · Shift · Operator Drill-Downs
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
            <Factory size={20} className="text-indigo-400" />
            <span>Manufacturing Station & Work Shift Performance Variance</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-tabulate defects to isolate machine tool mechanical wear, operator technique differences, or third-shift fatigue patterns.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-center">
          <button
            onClick={() => setActiveTab('machine')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'machine'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory size={13} />
            <span>Machines ({machines.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('shift')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'shift'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock size={13} />
            <span>Shifts (A / B / C)</span>
          </button>
          <button
            onClick={() => setActiveTab('operator')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'operator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={13} />
            <span>Operators ({operators.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Correlation Matrix</span>
          </button>
        </div>
      </div>

      {/* Active Filter Pill Alert */}
      {(activeMachineId || (activeShift && activeShift !== 'all') || activeOperatorId) && (
        <div className="my-3 bg-indigo-950/70 border border-indigo-700/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-indigo-400" />
            <span className="text-indigo-200 font-semibold">Active Drill-Down Filters:</span>
            {activeMachineId && (
              <span className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded font-mono">
                Machine: {machines.find(m => m.machineId === activeMachineId)?.machineName || activeMachineId}
              </span>
            )}
            {activeShift && activeShift !== 'all' && (
              <span className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded font-mono">
                Shift: {shifts.find(s => s.shift === activeShift)?.shiftLabel || activeShift}
              </span>
            )}
            {activeOperatorId && (
              <span className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded font-mono">
                Operator: {operators.find(o => o.operatorId === activeOperatorId)?.operatorName || activeOperatorId}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              onFilterMachine(undefined);
              onFilterShift('all');
              onFilterOperator(undefined);
            }}
            className="text-indigo-300 hover:text-white font-bold hover:underline"
          >
            Clear All Filters ✕
          </button>
        </div>
      )}

      {/* Tab 1: Machine Breakdown */}
      {activeTab === 'machine' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => {
            const isFiltered = activeMachineId === m.machineId;
            const pct = totalDefects > 0 ? Math.round((m.defectCount / totalDefects) * 100) : 0;

            return (
              <div
                key={m.machineId}
                className={`bg-slate-950/80 rounded-xl p-4 border transition-all ${
                  isFiltered
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/90 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {m.machineId}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{m.machineName}</h3>
                    <p className="text-[11px] text-slate-400">{m.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-bold text-rose-400">{m.defectCount}</span>
                    <span className="text-[10px] text-slate-500 block">defects ({pct}%)</span>
                  </div>
                </div>

                {/* Progress bar of defects */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full my-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-800/80 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">COPQ Scrap/Rework:</span>
                    <span className="font-bold text-amber-300">${m.totalCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Defective Units:</span>
                    <span className="font-bold text-cyan-300">{m.defectiveUnits} units</span>
                  </div>
                </div>

                {/* Top defect badge & Shift counts */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Top Defect:</span>
                    <span className="text-xs font-semibold text-rose-300 truncate max-w-[160px] inline-block">
                      {m.topDefectCategory}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      A: {m.shiftDistribution.shift_a}
                    </span>
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      B: {m.shiftDistribution.shift_b}
                    </span>
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      C: {m.shiftDistribution.shift_c}
                    </span>
                  </div>
                </div>

                {/* Drill-down Button */}
                <button
                  onClick={() => onFilterMachine(isFiltered ? undefined : m.machineId)}
                  className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isFiltered
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-indigo-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Filter size={12} />
                  <span>{isFiltered ? 'Reset Machine Filter' : 'Drill-Down This Machine'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Shift Breakdown */}
      {activeTab === 'shift' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {shifts.map((s) => {
            const isFiltered = activeShift === s.shift;
            const pct = totalDefects > 0 ? Math.round((s.defectCount / totalDefects) * 100) : 0;

            return (
              <div
                key={s.shift}
                className={`bg-slate-950/80 rounded-xl p-5 border transition-all ${
                  isFiltered
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/90 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">{s.shiftLabel}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{s.timeRange}</p>
                  </div>
                  <span className="text-2xl font-mono font-bold text-rose-400">
                    {s.defectCount}
                  </span>
                </div>

                <div className="space-y-3 my-4 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Share of Total:</span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Critical Defect Count:</span>
                    <span className="font-bold text-rose-400">{s.criticalDefects} critical</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Scrap / Rework COPQ:</span>
                    <span className="font-bold text-amber-300">${s.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Peak Defect Hour:</span>
                    <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 font-bold">
                      {s.peakDefectHour}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 block">Predominant Defect:</span>
                  <span className="text-xs font-semibold text-rose-300">{s.topDefect}</span>
                </div>

                <button
                  onClick={() => onFilterShift(isFiltered ? 'all' : s.shift)}
                  className={`mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isFiltered
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-indigo-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Filter size={12} />
                  <span>{isFiltered ? 'Reset Shift Filter' : 'Filter Pareto to this Shift'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Operator Breakdown */}
      {activeTab === 'operator' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((op) => {
            const isFiltered = activeOperatorId === op.operatorId;

            return (
              <div
                key={op.operatorId}
                className={`bg-slate-950/80 rounded-xl p-4 border transition-all ${
                  isFiltered
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/90 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400">
                      {op.operatorName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{op.operatorName}</h3>
                      <p className="text-[11px] text-slate-400">{op.role}</p>
                    </div>
                  </div>
                  <span className="text-lg font-mono font-bold text-rose-400">{op.defectCount}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs my-3 py-2 border-t border-b border-slate-800/80 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">First-Pass Yield:</span>
                    <span className={`font-bold ${op.firstPassYieldPct >= 96 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {op.firstPassYieldPct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Scrap Cost Incurred:</span>
                    <span className="font-bold text-rose-300">${op.scrapCostIncurred.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 block">Top Defect Mode:</span>
                  <span className="text-xs font-semibold text-rose-300 truncate block">{op.topDefect}</span>
                </div>

                <button
                  onClick={() => onFilterOperator(isFiltered ? undefined : op.operatorId)}
                  className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isFiltered
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-indigo-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Filter size={12} />
                  <span>{isFiltered ? 'Reset Operator Filter' : 'Filter Pareto to this Operator'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Correlation Matrix */}
      {activeTab === 'matrix' && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                <th className="p-3">Machine Cell</th>
                <th className="p-3">Shift A (Morning)</th>
                <th className="p-3">Shift B (Afternoon)</th>
                <th className="p-3">Shift C (Night)</th>
                <th className="p-3">Total Defects</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {machines.map((m) => (
                <tr key={m.machineId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-white block">{m.machineName}</span>
                    <span className="text-[10px] text-slate-500 font-sans">{m.type}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      m.shiftDistribution.shift_a > 3 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.shiftDistribution.shift_a}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      m.shiftDistribution.shift_b > 3 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.shiftDistribution.shift_b}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      m.shiftDistribution.shift_c > 3 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.shiftDistribution.shift_c}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-rose-400">{m.defectCount}</td>
                  <td className="p-3">
                    <button
                      onClick={() => onFilterMachine(m.machineId)}
                      className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 rounded font-sans text-[11px] transition-all"
                    >
                      Filter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
