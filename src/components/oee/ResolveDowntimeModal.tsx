// src/components/oee/ResolveDowntimeModal.tsx

import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  PlayCircle,
  Clock,
  Wrench,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { DowntimeEventRecord } from '../../types/oee';

interface ResolveDowntimeModalProps {
  event: DowntimeEventRecord;
  onResolve: (eventId: string, correctiveAction: string) => void;
  onClose: () => void;
}

export const ResolveDowntimeModal: React.FC<ResolveDowntimeModalProps> = ({
  event,
  onResolve,
  onClose
}) => {
  const [correctiveAction, setCorrectiveAction] = useState(
    'Insert indexed / tool offset reverified, workpiece checked, guard interlocks locked. Resumed standard feed.'
  );

  const startTimeDate = new Date(event.startTime);
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - startTimeDate.getTime()) / 60000));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResolve(event.id, correctiveAction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="bg-emerald-950/90 px-6 py-4 border-b border-emerald-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md">
              <PlayCircle size={22} />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                Resume Production & Close Downtime
              </span>
              <h2 className="text-base font-black text-white mt-0.5">
                Resolve {event.machineCode} Downtime
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Event Stats Snapshot */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Downtime Reason:</span>
              <span className="font-mono font-bold text-rose-300">[{event.reasonCode}] {event.reasonLabel}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="text-white font-medium">{event.categoryLabel}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Duration Auto-Calculated:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {elapsedMinutes} minutes ({(elapsedMinutes / 60).toFixed(1)} hrs)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
              <span>Logged by: {event.operatorName}</span>
              <span>Started: {startTimeDate.toLocaleTimeString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corrective Action & Root Cause Remediation <span className="text-emerald-400">*</span>
              </label>
              <textarea
                rows={3}
                value={correctiveAction}
                onChange={e => setCorrectiveAction(e.target.value)}
                placeholder="Describe what was repaired, replaced, or adjusted..."
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase rounded-lg shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Mark Resolved & Restart Machine</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
