// src/components/scheduling/GanttConflictModal.tsx

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Calendar,
  X,
  FastForward,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  ScheduledOperation,
  GanttConflict,
  GanttConflictType
} from '../../types/scheduling';
import { WorkCenter } from '../../types/routing';

interface GanttConflictModalProps {
  isOpen: boolean;
  operation: ScheduledOperation | null;
  targetWorkCenter: WorkCenter | null;
  targetDate: string;
  conflicts: GanttConflict[];
  cascadedSuccessors: ScheduledOperation[];
  onConfirm: (cascadeSuccessors: boolean) => void;
  onCancel: () => void;
}

export const GanttConflictModal: React.FC<GanttConflictModalProps> = ({
  isOpen,
  operation,
  targetWorkCenter,
  targetDate,
  conflicts,
  cascadedSuccessors,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !operation || !targetWorkCenter) return null;

  const hasCritical = conflicts.some(c => c.severity === 'critical');
  const hasSuccessorConflicts = conflicts.some(c => c.type === 'successor_violation');

  const getConflictIcon = (type: GanttConflictType) => {
    switch (type) {
      case 'predecessor_violation':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'capacity_overload':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'maintenance_collision':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'due_date_violation':
        return <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'successor_violation':
        return <FastForward className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
    }
  };

  const getConflictBadgeStyle = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'warning':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              hasCritical 
                ? 'bg-rose-950/80 text-rose-400 border-rose-800' 
                : 'bg-amber-950/80 text-amber-400 border-amber-800'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Scheduling Conflict Detected
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review routing constraints and capacity impacts before updating the schedule
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1 text-sm rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operation Move Summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Operation:</span>
            <span className="font-semibold text-slate-200">
              {operation.orderNumber} • Op {operation.operationSequence} ({operation.operationName})
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Rescheduling Path:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">{operation.scheduledDate} ({operation.workCenterCode})</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold text-indigo-300">{targetDate} ({targetWorkCenter.code})</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Run &amp; Setup Load:</span>
            <span className="font-mono text-slate-200 font-bold">{operation.totalRequiredHours} hours</span>
          </div>
        </div>

        {/* Conflicts List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Identified Conflicts ({conflicts.length})
            </h4>
            {hasCritical && (
              <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                Critical Constraint Violation
              </span>
            )}
          </div>

          <div className="space-y-2">
            {conflicts.map(conflict => (
              <div
                key={conflict.id}
                className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                  conflict.severity === 'critical'
                    ? 'bg-rose-950/40 border-rose-800/80'
                    : conflict.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/80'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                {getConflictIcon(conflict.type)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200">
                      {conflict.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-bold border ${getConflictBadgeStyle(conflict.severity)}`}>
                      {conflict.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {conflict.description}
                  </p>
                  {conflict.suggestedAction && (
                    <p className="text-indigo-300 text-[11px] font-medium pt-0.5">
                      💡 Suggested action: {conflict.suggestedAction}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cascaded Successors Preview */}
        {cascadedSuccessors.length > 0 && (
          <div className="bg-indigo-950/30 border border-indigo-800/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <FastForward className="w-4 h-4 text-indigo-400" />
              <span>Smart Cascade Optimization Available</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Moving this operation will push <strong className="text-indigo-200">{cascadedSuccessors.length} downstream operation(s)</strong> forward to prevent sequence collisions:
            </p>
            <div className="space-y-1 pt-1">
              {cascadedSuccessors.map(succ => (
                <div key={succ.id} className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-300">
                    Op {succ.operationSequence}: {succ.operationName}
                  </span>
                  <span className="font-mono text-indigo-300 font-semibold">
                    New Date: {succ.scheduledDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel Move
          </button>

          {cascadedSuccessors.length > 0 && (
            <button
              onClick={() => onConfirm(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950 transition flex items-center justify-center gap-1.5"
            >
              <FastForward className="w-3.5 h-3.5" />
              Cascade Successors &amp; Apply
            </button>
          )}

          <button
            onClick={() => onConfirm(false)}
            disabled={hasCritical && !hasSuccessorConflicts}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
              hasCritical && !hasSuccessorConflicts
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {hasCritical ? 'Force Apply Anyway' : 'Apply Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
