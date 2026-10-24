// src/components/production-dashboard/BottleneckHighlightCard.tsx

import React, { useState } from 'react';
import { BottleneckAlert } from '../../types/productionDashboard';
import { useToast } from '../../context/ToastContext';
import { 
  AlertTriangle, 
  Flame, 
  ArrowRight, 
  Zap, 
  Clock, 
  CheckCircle2, 
  RotateCw, 
  Split, 
  Wrench,
  ShieldAlert,
  Info
} from 'lucide-react';

interface Props {
  bottleneck: BottleneckAlert;
  onActionExecuted?: () => void;
}

export const BottleneckHighlightCard: React.FC<Props> = ({ bottleneck, onActionExecuted }) => {
  const { toastSuccess, toastInfo } = useToast();
  const [executedActions, setExecutedActions] = useState<string[]>([]);

  const handleExecuteAction = (actionId: string, label: string) => {
    setExecutedActions([...executedActions, actionId]);
    toastSuccess(`Resolution Playbook Activated: "${label}"! Dispatch queue re-balanced.`);
    if (onActionExecuted) onActionExecuted();
  };

  return (
    <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 border border-rose-800/60 shadow-xl space-y-4 font-sans relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-800/40 gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl animate-pulse">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                🚨 Primary Shopfloor Bottleneck Identified
              </span>
              <span className="text-[10px] font-mono text-slate-400">TOC Goldratt Engine</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {bottleneck.workCenterName}
            </h3>
          </div>
        </div>

        {/* Key Metrics Pill */}
        <div className="flex items-center space-x-3 font-mono text-xs self-start sm:self-center">
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Spindle Utilization</span>
            <strong className="text-rose-400 text-sm font-black">{bottleneck.utilizationPct}%</strong>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Accumulated Queue</span>
            <strong className="text-amber-400 text-sm font-black">{bottleneck.queuedPieces} pcs</strong>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Est. Clearing Time</span>
            <strong className="text-white text-sm font-black">{bottleneck.estimatedClearingHours} hrs</strong>
          </div>
        </div>
      </div>

      {/* Diagnostic Root Cause */}
      <div className="bg-slate-800/50 border border-rose-900/40 rounded-xl p-3.5 space-y-1.5 text-xs">
        <div className="flex items-center space-x-2 text-rose-300 font-mono text-[11px] font-bold uppercase">
          <Info className="h-3.5 w-3.5" />
          <span>Root Cause Diagnostics & Impact Analysis</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          {bottleneck.rootCause}
        </p>
        <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center space-x-4">
          <span>Cycle Time Variance: <strong className="text-amber-400">+{bottleneck.cycleTimeVariancePct}%</strong></span>
          <span>Impacted Downstream Batches: <strong className="text-white">{bottleneck.impactedWorkOrdersCount} Work Orders</strong></span>
        </div>
      </div>

      {/* Actionable Resolution Playbook */}
      <div className="space-y-2 pt-1">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          Automated Bottleneck Resolution Playbook (Click to Execute)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
          {bottleneck.suggestedActions.map((act) => {
            const isExecuted = executedActions.includes(act.id);

            return (
              <button
                key={act.id}
                onClick={() => handleExecuteAction(act.id, act.label)}
                disabled={isExecuted}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                  isExecuted
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 opacity-80 cursor-default'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                <div className="p-1.5 bg-slate-900 rounded-lg text-amber-400 shrink-0 mt-0.5">
                  {act.type === 'reroute' && <Zap className="h-4 w-4" />}
                  {act.type === 'overtime' && <Clock className="h-4 w-4" />}
                  {act.type === 'split_order' && <Split className="h-4 w-4" />}
                  {act.type === 'maintenance' && <Wrench className="h-4 w-4" />}
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-bold font-sans flex items-center justify-between">
                    <span>{act.label}</span>
                    {isExecuted && (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Executed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-snug">
                    {act.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
