// src/components/scheduling/BottleneckAlertsDrawer.tsx

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Sliders,
  Layers,
  Cpu,
  UserCheck,
  ShieldAlert,
  Flame,
  PlusCircle
} from 'lucide-react';
import { BottleneckAlert, BottleneckSeverity } from '../../types/scheduling';

interface BottleneckAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: BottleneckAlert[];
  onAddOvertime: (workCenterId?: string) => void;
  onOpenRescheduleModal?: (orderNumber?: string) => void;
}

export const BottleneckAlertsDrawer: React.FC<BottleneckAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAddOvertime,
  onOpenRescheduleModal
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | BottleneckSeverity>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  const getSeverityBadge = (severity: BottleneckSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-700';
      case 'high':
        return 'bg-amber-950/80 text-amber-300 border-amber-700';
      case 'medium':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/60">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Bottleneck Diagnostics &amp; Alerts
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono font-bold">
                  {alerts.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated detection of machine capacity deficits, delivery risks, and operator shortages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 mr-1">Filter Severity:</span>
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              severityFilter === 'all'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              severityFilter === 'critical'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Critical ({alerts.filter(a => a.severity === 'critical').length})
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              severityFilter === 'high'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            High ({alerts.filter(a => a.severity === 'high').length})
          </button>
        </div>

        {/* ── Alerts List ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="font-semibold text-slate-200 text-sm">No Bottlenecks Detected</p>
              <p>Current production schedule is balanced within finite machine capacity limits.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border bg-slate-950/70 transition space-y-3 ${
                  alert.severity === 'critical' 
                    ? 'border-rose-800/80 shadow-md shadow-rose-950/30' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/50 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <h4 className="font-semibold text-slate-100 text-xs">
                          {alert.title}
                        </h4>
                      </div>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics pill if capacity overload */}
                {alert.capacityHours !== undefined && alert.loadHours !== undefined && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Finite Available:</span>
                      <strong className="text-slate-200 ml-1 font-mono">{alert.capacityHours}h</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Scheduled Load:</span>
                      <strong className="text-rose-400 ml-1 font-mono">{alert.loadHours}h</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Overload:</span>
                      <strong className="text-rose-400 ml-1 font-mono">+{alert.overloadPercent}%</strong>
                    </div>
                  </div>
                )}

                {/* Actionable recommendation button */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="text-slate-300 text-[11px] flex-1">
                    <span className="text-indigo-400 font-semibold block mb-0.5">Recommended Mitigation:</span>
                    {alert.suggestedAction}
                  </div>

                  {alert.actionPayload?.actionType === 'add_overtime' && (
                    <button
                      onClick={() => onAddOvertime(alert.workCenterId)}
                      className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 shadow transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add Overtime (+4h)
                    </button>
                  )}

                  {alert.actionPayload?.actionType === 'expedite' && onOpenRescheduleModal && (
                    <button
                      onClick={() => onOpenRescheduleModal(alert.orderNumber)}
                      className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1 shadow transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Reschedule Op
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {filteredAlerts.length} issue(s) flagged for production planning
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
