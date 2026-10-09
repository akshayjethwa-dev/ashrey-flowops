// src/components/scheduling/WhatIfSimulationModal.tsx

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  AlertTriangle,
  Clock,
  TrendingUp,
  X,
  CheckCircle2,
  RotateCcw,
  Cpu
} from 'lucide-react';
import { SchedulingSimulationParams, WorkCenterCapacitySummary } from '../../types/scheduling';
import { WorkCenter } from '../../types/routing';

interface WhatIfSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workCenters: WorkCenter[];
  simulationActive: boolean;
  simulationParams: SchedulingSimulationParams;
  onToggleSimulation: (active: boolean) => void;
  onUpdateParams: (params: SchedulingSimulationParams) => void;
}

export const WhatIfSimulationModal: React.FC<WhatIfSimulationModalProps> = ({
  isOpen,
  onClose,
  workCenters,
  simulationActive,
  simulationParams,
  onToggleSimulation,
  onUpdateParams
}) => {
  const [includeOvertime, setIncludeOvertime] = useState<boolean>(simulationParams.includeOvertimeShift);
  const [efficiency, setEfficiency] = useState<number>(simulationParams.simulatedEfficiencyFactor || 0.88);
  const [downtimeMachineId, setDowntimeMachineId] = useState<string>(simulationParams.simulatedDowntimeMachineId || '');

  if (!isOpen) return null;

  const handleApply = () => {
    onUpdateParams({
      includeOvertimeShift: includeOvertime,
      simulatedEfficiencyFactor: efficiency,
      simulatedDowntimeMachineId: downtimeMachineId || undefined
    });
    onToggleSimulation(true);
    onClose();
  };

  const handleReset = () => {
    onToggleSimulation(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-950/60 text-teal-400 border border-teal-800/60">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                What-If Finite Capacity Simulation Sandbox
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Stress-test plant throughput under overtime, sudden machine breakdowns, and OEE changes.
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

        {/* Simulation Controls */}
        <div className="space-y-4 text-xs">
          {/* 1. Overtime Shift */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Add Daily Overtime Shift (+4 Hours)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Simulates opening evening/weekend overtime to absorb machine backlogs.
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeOvertime}
                onChange={e => setIncludeOvertime(e.target.checked)}
                className="w-5 h-5 accent-teal-500 rounded"
              />
            </div>
          </div>

          {/* 2. Simulated Machine Breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div>
              <span className="font-semibold text-slate-200 block">
                Simulate Unplanned Machine Breakdown
              </span>
              <span className="text-slate-400 text-[11px]">
                Takes an active work center offline for 8 hours daily to inspect bottleneck migration.
              </span>
            </div>
            <select
              value={downtimeMachineId}
              onChange={e => setDowntimeMachineId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="">-- None (Normal operation) --</option>
              {workCenters.map(wc => (
                <option key={wc.id} value={wc.id}>
                  {wc.code} — {wc.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Plant-wide OEE Efficiency */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Simulated OEE Efficiency Multiplier
                </span>
                <span className="text-slate-400 text-[11px]">
                  Assess impact of quick die changeovers (SMED) and TPM improvements.
                </span>
              </div>
              <span className="font-mono font-bold text-teal-400 text-sm">
                {Math.round(efficiency * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.65"
              max="1.00"
              step="0.05"
              value={efficiency}
              onChange={e => setEfficiency(parseFloat(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Nominal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Run Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
