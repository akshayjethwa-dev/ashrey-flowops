// src/components/scheduling/RescheduleOperationModal.tsx

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Cpu,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers
} from 'lucide-react';
import { ScheduledOperation, ShiftDefinition } from '../../types/scheduling';
import { WorkCenter } from '../../types/routing';

interface RescheduleOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: ScheduledOperation | null;
  workCenters: WorkCenter[];
  shifts: ShiftDefinition[];
  onReschedule: (
    operationId: string,
    newDate: string,
    newWorkCenterId?: string,
    newShiftId?: string
  ) => Promise<void>;
}

export const RescheduleOperationModal: React.FC<RescheduleOperationModalProps> = ({
  isOpen,
  onClose,
  operation,
  workCenters,
  shifts,
  onReschedule
}) => {
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetWorkCenterId, setTargetWorkCenterId] = useState<string>('');
  const [targetShiftId, setTargetShiftId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (operation) {
      setTargetDate(operation.scheduledDate);
      setTargetWorkCenterId(operation.workCenterId);
      setTargetShiftId(operation.scheduledShiftId || 'sh_morning');
    }
  }, [operation]);

  if (!isOpen || !operation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) return;

    setSubmitting(true);
    try {
      await onReschedule(operation.id, targetDate, targetWorkCenterId, targetShiftId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isLate = operation.dueDate && targetDate > operation.dueDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  {operation.orderNumber}
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  Reschedule Operation Slot
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Op {operation.operationSequence}: {operation.operationName}
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

        {/* Operation Info Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Part:</span>
            <span className="text-slate-200 font-medium">{operation.partName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Customer PO Due Date:</span>
            <span className="font-mono font-semibold text-slate-200">{operation.dueDate || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Required Machine Time:</span>
            <span className="font-mono font-semibold text-indigo-300">{operation.totalRequiredHours} hours</span>
          </div>
        </div>

        {/* Reschedule Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Target Schedule Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
            {isLate && (
              <p className="text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Warning: Target date is past customer PO delivery date ({operation.dueDate})
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Reassign Work Center / Alternative Machine</label>
            <select
              value={targetWorkCenterId}
              onChange={e => setTargetWorkCenterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {workCenters.map(wc => (
                <option key={wc.id} value={wc.id}>
                  {wc.code} — {wc.name} ({wc.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Target Shift</label>
            <select
              value={targetShiftId}
              onChange={e => setTargetShiftId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply Finite Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
