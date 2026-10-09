// src/components/scheduling/MachineCalendarModal.tsx

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Cpu,
  CheckCircle2,
  Wrench,
  ShieldAlert
} from 'lucide-react';
import { MachineDowntime } from '../../types/scheduling';
import { WorkCenter } from '../../types/routing';

interface MachineCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  workCenters: WorkCenter[];
  downtimes: MachineDowntime[];
  onSaveDowntime: (event: MachineDowntime) => Promise<void>;
  onDeleteDowntime: (id: string) => Promise<void>;
}

export const MachineCalendarModal: React.FC<MachineCalendarModalProps> = ({
  isOpen,
  onClose,
  workCenters,
  downtimes,
  onSaveDowntime,
  onDeleteDowntime
}) => {
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState<string>(workCenters[0]?.id || '');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [downtimeHours, setDowntimeHours] = useState<number>(4.0);
  const [reason, setReason] = useState<MachineDowntime['reason']>('preventive_maintenance');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wc = workCenters.find(w => w.id === selectedWorkCenterId);
    if (!wc) return;

    setSubmitting(true);
    try {
      const newDowntime: MachineDowntime = {
        id: `dt_${Date.now()}`,
        workCenterId: wc.id,
        workCenterCode: wc.code,
        workCenterName: wc.name,
        date,
        startTime,
        endTime,
        downtimeHours: Number(downtimeHours),
        reason,
        description: description.trim() || `${reason.replace('_', ' ')} on ${wc.code}`,
        impactOnCapacity: 'full_shutdown',
        status: 'scheduled'
      };

      await onSaveDowntime(newDowntime);
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Machine Capacity Calendar &amp; Downtime
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Schedule preventive maintenance, tool changeovers, and repair outages that deduct from finite machine capacity.
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

        {/* ── Schedule New Downtime Window Form ─────────────────── */}
        <form onSubmit={handleSubmit} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Schedule Planned Maintenance / Outage
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Work Center / Machine</label>
              <select
                value={selectedWorkCenterId}
                onChange={e => setSelectedWorkCenterId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {workCenters.map(wc => (
                  <option key={wc.id} value={wc.id}>
                    {wc.code} — {wc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Outage Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="preventive_maintenance">Preventive Maintenance (PM)</option>
                <option value="breakdown">Emergency Repair / Breakdown</option>
                <option value="tooling_change">Tooling / Die Changeover</option>
                <option value="calibration">Metrology Calibration &amp; Probing</option>
                <option value="holiday">Plant Holiday / Shutdown</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={downtimeHours}
                  onChange={e => setDowntimeHours(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">Outage Description &amp; SOP Instructions</label>
              <input
                type="text"
                placeholder="e.g. Spindle runout calibration, guideway lubrication, coolant flush"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Wrench className="w-3.5 h-3.5" />
              Schedule Maintenance Window
            </button>
          </div>
        </form>

        {/* ── Active Downtimes List ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Active Planned Maintenance Windows ({downtimes.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              Hours are automatically subtracted from available finite capacity
            </span>
          </div>

          {downtimes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
              No machine downtime scheduled. All work centers operating at 100% nominal shift availability.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {downtimes.map(dt => (
                <div
                  key={dt.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/50 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">
                          {dt.workCenterCode}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({dt.workCenterName})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] uppercase font-semibold">
                          {dt.reason.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1">
                        {dt.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                        <span>Date: <strong className="text-slate-200">{dt.date}</strong></span>
                        <span>•</span>
                        <span>Time: {dt.startTime} - {dt.endTime}</span>
                        <span>•</span>
                        <span className="text-rose-400 font-semibold">Downtime: {dt.downtimeHours} hrs</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteDowntime(dt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Remove outage window"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
