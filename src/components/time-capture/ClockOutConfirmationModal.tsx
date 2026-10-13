// src/components/time-capture/ClockOutConfirmationModal.tsx

import React, { useState } from 'react';
import {
  X,
  StopCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  User,
  Sliders,
  Flame
} from 'lucide-react';
import { OperationTimeLog } from '../../types/timeCapture';

interface ClockOutConfirmationModalProps {
  log: OperationTimeLog;
  onConfirm: (params: {
    unitsProduced: number;
    unitsScrapped: number;
    scrapReason?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export const ClockOutConfirmationModal: React.FC<ClockOutConfirmationModalProps> = ({
  log,
  onConfirm,
  onCancel
}) => {
  const [unitsProduced, setUnitsProduced] = useState<number>(100);
  const [unitsScrapped, setUnitsScrapped] = useState<number>(0);
  const [scrapReason, setScrapReason] = useState<string>('Tool wear / chatter');
  const [notes, setNotes] = useState<string>('');

  // Calculate live elapsed minutes at the moment of stopping
  const startMs = new Date(log.startedAt).getTime();
  const nowMs = Date.now();
  const elapsedMinutes = Math.max(1, Math.round(((nowMs - startMs) / 60000) * 10) / 10);
  const standardMinutes = log.standardTimeMinutes || 60;
  const varianceMinutes = Math.round((elapsedMinutes - standardMinutes) * 10) / 10;
  const efficiencyPercent = Math.max(1, Math.round((standardMinutes / elapsedMinutes) * 1000) / 10);

  const isAhead = varianceMinutes <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      unitsProduced: Number(unitsProduced),
      unitsScrapped: Number(unitsScrapped),
      scrapReason: unitsScrapped > 0 ? scrapReason : undefined,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 rounded-lg text-white">
              <StopCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  STOP & CLOCK OUT
                </span>
                <span className="text-xs font-mono text-slate-400">{log.workOrderNumber}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                {log.operationName}
              </h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. ACTUAL VS STANDARD TIME CARD (Acceptance Criteria #3) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Cycle Time Performance Analysis</span>
              <span className="text-slate-500 font-mono">
                Operator: <strong>{log.operatorName}</strong> ({log.operatorBadgeNumber})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] font-mono uppercase text-slate-400">Standard Time</div>
                <div className="text-base font-mono font-bold text-slate-800">
                  {standardMinutes} min
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] font-mono uppercase text-slate-400">Actual Elapsed</div>
                <div className="text-base font-mono font-bold text-cyan-700">
                  {elapsedMinutes} min
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                isAhead
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="text-[10px] font-mono uppercase">
                  {isAhead ? 'Saved (Variance)' : 'Overrun (Variance)'}
                </div>
                <div className="text-base font-mono font-black flex items-center justify-center gap-1">
                  {isAhead ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  <span>{isAhead ? `-${Math.abs(varianceMinutes)}m` : `+${varianceMinutes}m`}</span>
                </div>
              </div>
            </div>

            {/* Efficiency Badge */}
            <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
              efficiencyPercent >= 100
                ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-300'
                : 'bg-amber-100/70 text-amber-900 border border-amber-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-700" />
                <span>
                  {efficiencyPercent >= 100
                    ? `Optimal Speed: ${efficiencyPercent}% Efficiency (Beat Standard by ${Math.abs(varianceMinutes)} min)`
                    : `Cycle Speed: ${efficiencyPercent}% Efficiency (${varianceMinutes} min overrun)`}
                </span>
              </div>
              <span className="font-mono font-bold">{efficiencyPercent}%</span>
            </div>
          </div>

          {/* 2. Parts Output & Defect Logging */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Good Completed Pieces <span className="text-emerald-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={unitsProduced}
                onChange={e => setUnitsProduced(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scrapped / Defective Pieces
              </label>
              <input
                type="number"
                min="0"
                value={unitsScrapped}
                onChange={e => setUnitsScrapped(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {unitsScrapped > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scrap Root Cause Reason
              </label>
              <select
                value={scrapReason}
                onChange={e => setScrapReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-rose-500"
              >
                <option value="Tool wear / insert chipping">Tool wear / insert chipping</option>
                <option value="Dimensional bore out of tolerance">Dimensional bore out of tolerance</option>
                <option value="Raw material casting porosity / blowhole">Raw material casting porosity / blowhole</option>
                <option value="Machine chuck slippage / vibration">Machine chuck slippage / vibration</option>
                <option value="First-piece setup scrap">First-piece setup scrap</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operator Closing Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Completed batch; cleaned chips from conveyor; ready for inspection..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <CheckCircle2 size={16} />
              <span>Confirm Clock-Out & Log {elapsedMinutes}m</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
