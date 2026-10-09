// src/components/scheduling/CapacityLoadDashboard.tsx

import React, { useState } from 'react';
import {
  Cpu,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertCircle,
  Zap,
  Sliders,
  ArrowUpRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import {
  WorkCenterCapacitySummary,
  SchedulingKPIs,
  ScheduledOperation,
  DayWorkCenterCapacity
} from '../../types/scheduling';

interface CapacityLoadDashboardProps {
  kpis: SchedulingKPIs;
  summaries: WorkCenterCapacitySummary[];
  scheduledOperations: ScheduledOperation[];
  timeWindowDays: number;
  onSelectWorkCenter?: (workCenterId: string) => void;
  onOpenRescheduleModal?: (op: ScheduledOperation) => void;
  onOpenAlerts?: () => void;
}

export const CapacityLoadDashboard: React.FC<CapacityLoadDashboardProps> = ({
  kpis,
  summaries,
  scheduledOperations,
  timeWindowDays,
  onSelectWorkCenter,
  onOpenRescheduleModal,
  onOpenAlerts
}) => {
  const [expandedWorkCenterId, setExpandedWorkCenterId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedWorkCenterId(prev => prev === id ? null : id);
  };

  // Helper for utilization color styling
  const getUtilizationBadge = (percent: number) => {
    if (percent > 100) {
      return {
        bg: 'bg-rose-950/40 text-rose-300 border-rose-800/60',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-400',
        label: 'Overloaded'
      };
    } else if (percent >= 80) {
      return {
        bg: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-400',
        label: 'High Load'
      };
    } else if (percent > 0) {
      return {
        bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-400',
        label: 'Balanced'
      };
    }
    return {
      bg: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
      barColor: 'bg-slate-600',
      textColor: 'text-slate-400',
      label: 'Idle / Available'
    };
  };

  return (
    <div className="space-y-6">
      {/* ── Top Level KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Machines */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Work Centers</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {kpis.totalWorkCenters}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Active production units
          </p>
        </div>

        {/* Total Available Finite Capacity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Finite Capacity</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300">
            {kpis.totalWeeklyCapacityHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Net effective ({timeWindowDays}d)
          </p>
        </div>

        {/* Scheduled Load */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Scheduled Load</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {kpis.totalWeeklyScheduledLoadHours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Queued operations runtime
          </p>
        </div>

        {/* Factory Utilization */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Factory Utilization</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`text-2xl font-bold ${
            kpis.averageFactoryUtilization > 95 ? 'text-rose-400' :
            kpis.averageFactoryUtilization > 80 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {kpis.averageFactoryUtilization}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kpis.averageFactoryUtilization > 95 ? 'bg-rose-500' :
                kpis.averageFactoryUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, kpis.averageFactoryUtilization)}%` }}
            />
          </div>
        </div>

        {/* Bottleneck Centers */}
        <div 
          onClick={onOpenAlerts}
          className={`border rounded-xl p-3.5 shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${
            kpis.bottleneckWorkCentersCount > 0 
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' 
              : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 font-medium">
            <span>Bottlenecks</span>
            <AlertTriangle className={`w-4 h-4 ${kpis.bottleneckWorkCentersCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold">
            {kpis.bottleneckWorkCentersCount}
          </div>
          <p className="text-[11px] text-rose-400/90 mt-0.5">
            {kpis.bottleneckWorkCentersCount > 0 ? 'Action required' : 'Optimal throughput'}
          </p>
        </div>

        {/* At-Risk Work Orders */}
        <div 
          onClick={onOpenAlerts}
          className={`border rounded-xl p-3.5 shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${
            kpis.atRiskWorkOrdersCount > 0 
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' 
              : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 font-medium">
            <span>At-Risk Orders</span>
            <Zap className={`w-4 h-4 ${kpis.atRiskWorkOrdersCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold">
            {kpis.atRiskWorkOrdersCount}
          </div>
          <p className="text-[11px] text-amber-400/90 mt-0.5">
            {kpis.atRiskWorkOrdersCount > 0 ? 'Due date / overload risk' : 'On-time schedule'}
          </p>
        </div>
      </div>

      {/* ── Work Centers Capacity vs Load Grid ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Work Center Capacity vs. Scheduled Load
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Finite machine operating hours compared against scheduled operations queue
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Balanced (&lt;80%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              High Load (80-100%)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Overloaded (&gt;100%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {summaries.map(wc => {
            const isExpanded = expandedWorkCenterId === wc.workCenterId;
            const badge = getUtilizationBadge(wc.weeklyUtilizationPercent);

            // Ops scheduled on this machine
            const machineOps = scheduledOperations.filter(o => o.workCenterId === wc.workCenterId);

            return (
              <div
                key={wc.workCenterId}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 ${
                  wc.isBottleneck 
                    ? 'border-rose-800/60 shadow-lg shadow-rose-950/20' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(wc.workCenterId)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-850"
                >
                  <div className="flex items-start gap-3 min-w-[280px]">
                    <div className={`p-2.5 rounded-lg mt-0.5 ${
                      wc.isBottleneck ? 'bg-rose-900/40 text-rose-400 border border-rose-800/50' : 'bg-slate-800 text-indigo-400'
                    }`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                          {wc.code}
                        </span>
                        <h4 className="font-medium text-slate-100 text-sm md:text-base">
                          {wc.name}
                        </h4>
                        {wc.isBottleneck && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-200 border border-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            BOTTLENECK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {wc.department}
                        </span>
                        <span>•</span>
                        <span>{wc.activeShiftsCount} Active Shift(s)</span>
                        <span>•</span>
                        <span>{machineOps.length} Queued Operation(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Bar & Utilization */}
                  <div className="flex-1 max-w-md px-2">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-400">
                        Load: <strong className="text-slate-200">{wc.weeklyScheduledLoadHours}h</strong> / Capacity: <strong className="text-slate-200">{wc.weeklyEffectiveCapacityHours}h</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${badge.bg}`}>
                        {wc.weeklyUtilizationPercent}% • {badge.label}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${badge.barColor}`}
                        style={{ width: `${Math.min(100, wc.weeklyUtilizationPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Load Mini Sparkline / Day Bubbles */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {wc.days.slice(0, 7).map(day => {
                      const dayBadge = getUtilizationBadge(day.utilizationPercent);
                      return (
                        <div
                          key={day.date}
                          title={`${day.date} (${day.dayOfWeek}): ${day.scheduledLoadHours}h scheduled of ${day.finiteAvailableHours}h available (${day.utilizationPercent}%)`}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] min-w-[42px] border ${
                            day.isOverloaded 
                              ? 'bg-rose-950/50 border-rose-700 text-rose-200' 
                              : day.scheduledLoadHours > 0 
                                ? 'bg-slate-800/80 border-slate-700 text-slate-300' 
                                : 'bg-slate-900 border-slate-800/50 text-slate-500'
                          }`}
                        >
                          <span className="font-semibold">{day.dayOfWeek}</span>
                          <span className="text-[9px] font-mono mt-0.5">{day.scheduledLoadHours}h</span>
                        </div>
                      );
                    })}

                    <button 
                      className="p-1 text-slate-400 hover:text-slate-200 rounded transition ml-1"
                      aria-label="Expand details"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* ── Expanded Detail Drawer: Day Breakdown & Queued Operations ── */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/50 p-4 space-y-4">
                    {/* Day-by-Day Finite Capacity Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          Daily Finite Capacity &amp; Load Breakdown
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          Daily Effective Hours = (Net Shift Hours × Efficiency Factor) − Maintenance Downtime
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Day</th>
                              <th className="py-2 px-3">Gross Hours</th>
                              <th className="py-2 px-3">Downtime</th>
                              <th className="py-2 px-3">Finite Available</th>
                              <th className="py-2 px-3">Scheduled Load</th>
                              <th className="py-2 px-3">Utilization</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {wc.days.map(d => {
                              const dBadge = getUtilizationBadge(d.utilizationPercent);
                              return (
                                <tr key={d.date} className="hover:bg-slate-900/60">
                                  <td className="py-2 px-3 font-mono text-slate-300 font-medium">{d.date}</td>
                                  <td className="py-2 px-3 text-slate-400">{d.dayOfWeek}</td>
                                  <td className="py-2 px-3 text-slate-400">{d.grossCapacityHours}h</td>
                                  <td className="py-2 px-3">
                                    {d.downtimeHours > 0 ? (
                                      <span className="text-rose-400 font-medium">-{d.downtimeHours}h (Maint)</span>
                                    ) : (
                                      <span className="text-slate-500">0h</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-200">{d.finiteAvailableHours}h</td>
                                  <td className="py-2 px-3 font-mono font-semibold text-indigo-300">{d.scheduledLoadHours}h</td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${dBadge.barColor}`}
                                          style={{ width: `${Math.min(100, d.utilizationPercent)}%` }}
                                        />
                                      </div>
                                      <span className={`font-mono font-semibold ${dBadge.textColor}`}>
                                        {d.utilizationPercent}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${dBadge.bg}`}>
                                      {dBadge.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Queued Work Order Operations on this Machine */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          Operations Scheduled on this Work Center ({machineOps.length})
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          Click any operation to re-schedule or adjust slot
                        </span>
                      </div>

                      {machineOps.length === 0 ? (
                        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                          No operations currently allocated to this machine in the active schedule window.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                                <th className="py-2 px-3">Work Order</th>
                                <th className="py-2 px-3">Part Name</th>
                                <th className="py-2 px-3">Operation</th>
                                <th className="py-2 px-3">Qty</th>
                                <th className="py-2 px-3">Run Time</th>
                                <th className="py-2 px-3">Scheduled Date</th>
                                <th className="py-2 px-3">Due Date</th>
                                <th className="py-2 px-3">Assigned Operator</th>
                                <th className="py-2 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {machineOps.map(op => {
                                const isLate = op.dueDate && op.scheduledDate > op.dueDate;
                                return (
                                  <tr key={op.id} className="hover:bg-slate-900/70">
                                    <td className="py-2 px-3 font-mono font-medium text-slate-200">
                                      <span className={`px-1.5 py-0.5 rounded text-[11px] border mr-1.5 ${
                                        op.priority === 'urgent' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                                        op.priority === 'high' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                                        'bg-slate-800 text-slate-300 border-slate-700'
                                      }`}>
                                        {op.priority.toUpperCase()}
                                      </span>
                                      {op.orderNumber}
                                    </td>
                                    <td className="py-2 px-3 text-slate-300 max-w-[180px] truncate">
                                      {op.partName}
                                    </td>
                                    <td className="py-2 px-3 text-indigo-300 font-medium">
                                      Op {op.operationSequence}: {op.operationName}
                                    </td>
                                    <td className="py-2 px-3 font-mono">{op.batchQuantity} pcs</td>
                                    <td className="py-2 px-3 font-mono font-semibold text-slate-200">
                                      {op.totalRequiredHours} hrs
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-300">
                                      {op.scheduledDate}
                                    </td>
                                    <td className="py-2 px-3 font-mono">
                                      <span className={isLate ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                        {op.dueDate} {isLate && '⚠️ LATE'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-400">
                                      {op.assignedOperatorName || 'Unassigned'}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onOpenRescheduleModal) onOpenRescheduleModal(op);
                                        }}
                                        className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[11px] font-medium transition"
                                      >
                                        Reschedule
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
